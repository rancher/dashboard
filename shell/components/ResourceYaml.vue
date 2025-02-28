<script>
import jsyaml from 'js-yaml';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import Footer from '@shell/components/form/Footer';
import { ANNOTATIONS_TO_FOLD } from '@shell/config/labels-annotations';
import { ensureRegex } from '@shell/utils/string';
import { typeOf } from '@shell/utils/sort';

import {
  _CREATE,
  _VIEW,
  PREVIEW,
  _FLAGGED,
  _UNFLAG,
  _EDIT,
} from '@shell/config/query-params';
import { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  emits: ['error'],

  components: {
    Footer,
    FileSelector,
    YamlEditor
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    initialYamlForDiff: {
      type:    String,
      default: null,
    },

    yaml: {
      type:     String,
      required: true,
    },

    doneRoute: {
      type:    [String, Object],
      default: null,
    },

    offerPreview: {
      type:    Boolean,
      default: true,
    },

    parentParams: {
      type:    Object,
      default: null,
    },

    doneOverride: {
      type:    [Function, Object],
      default: null
    },

    showFooter: {
      type:    Boolean,
      default: true
    },

    applyHooks: {
      type:    Function,
      default: null,
    }
  },

  data() {
    // Initial load with a preview showing no diff isn't very useful
    this.$router.applyQuery({ [PREVIEW]: _UNFLAG });

    return {
      initialYaml:  this.initialYamlForDiff || this.yaml,
      currentYaml:  this.yaml,
      showPreview:  false,
      errors:       null,
      cm:           null,
      initialReady: true
    };
  },

  computed: {
    schema() {
      const inStore = this.$store.getters['currentStore'](this.value.type);

      return this.$store.getters[`${ inStore }/schemaFor`]( this.value.type );
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    editorMode() {
      // Include the mode in the route as a dependency
      // of this computed property so that the editor
      // toggles when you navigate back and forth between
      // edit and view.
      if ( this.$route.query.mode === _VIEW || (this.isView && (this.$route.query.mode !== _EDIT || this.$route.query.mode !== _VIEW))) {
        return EDITOR_MODES.VIEW_CODE;
      } else if ( this.showPreview ) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },

    canDiff() {
      return this.initialYaml !== this.currentYaml;
    },
  },

  watch: {
    yaml(neu) {
      if ( this.mode === _VIEW ) {
        this.currentYaml = neu;
      }
    },

    mode(neu, old) {
      // if this component is changing from viewing a resource to 'creating' that resource, it must actually be cloning
      // clean yaml accordingly
      if (neu === _CREATE && old === _VIEW) {
        this.currentYaml = this.value.cleanYaml(this.yaml, neu);
      }
    }
  },

  methods: {
    onInput(yaml) {
      this.currentYaml = yaml;
      this.onReady(this.cm);
    },

    onReady(cm) {
      if (!this.initialReady) {
        return;
      }
      this.initialReady = false;

      this.cm = cm;

      if ( this.isEdit ) {
        cm.foldLinesMatching(/^status:\s*$/);
      }

      try {
        const parsed = jsyaml.load(this.currentYaml);
        const annotations = Object.keys(parsed?.metadata?.annotations || {});
        const regexes = ANNOTATIONS_TO_FOLD.map((x) => ensureRegex(x));

        let foldAnnotations = false;

        for ( const k of annotations ) {
          if ( foldAnnotations ) {
            break;
          }

          for ( const regex of regexes ) {
            if ( k.match(regex) ) {
              foldAnnotations = true;
              break;
            }
          }
        }

        if ( foldAnnotations ) {
          cm.foldLinesMatching(/^\s+annotations:\s*$/);
        }
      } catch (e) {}

      cm.foldLinesMatching(/managedFields/);

      // Allow the model to supply an array of json paths to fold other sections in the YAML for the given resource type
      if (this.value?.yamlFolding) {
        this.value.yamlFolding.forEach((path) => cm.foldYaml(path));
      }

      // regardless of edit or create we should probably fold all the comments so they dont get out of hand.
      const saved = cm.getMode().fold;

      cm.getMode().fold = 'yamlcomments';
      cm.execCommand('foldAll');
      cm.getMode().fold = saved;
    },

    updateValue(value) {
      this.$refs.yamleditor.updateValue(value);
    },

    preview() {
      this.updateValue(this.currentYaml);
      this.showPreview = true;
      this.$router.applyQuery({ [PREVIEW]: _FLAGGED });
    },

    unpreview() {
      this.showPreview = false;
      this.$router.applyQuery({ [PREVIEW]: _UNFLAG });
    },

    async save(buttonDone) {
      const yaml = this.value.yamlForSave(this.currentYaml) || this.currentYaml;

      try {
        if ( this.applyHooks ) {
          await this.applyHooks(BEFORE_SAVE_HOOKS);
        }

        try {
          await this.value.saveYaml(yaml);
        } catch (err) {
          return onError.call(this, err);
        }

        if ( this.applyHooks ) {
          await this.applyHooks(AFTER_SAVE_HOOKS);
        }

        buttonDone(true);
        this.done();
      } catch (err) {
        return onError.call(this, err);
      }

      function onError(err) {
        if ( err && err.response && err.response.data ) {
          const body = err.response.data;

          if ( body && body.message ) {
            this.errors = [body.message];
          } else {
            this.errors = [err];
          }
        } else {
          this.errors = [err];
        }

        buttonDone(false);

        this.$emit('error', exceptionToErrorsArray(err));
      }
    },

    done() {
      if (this.doneOverride) {
        return typeof (this.doneOverride) === 'function' ? this.doneOverride() : this.$router.replace(this.doneOverride);
      }
      if ( !this.doneRoute ) {
        return;
      }
      if (typeOf(this.doneRoute) === 'object') {
        this.$router.replace(this.doneRoute);

        return;
      }
      this.$router.replace({
        name:   this.doneRoute,
        params: { resource: this.value.type }
      });
    },

    onFileSelected(value) {
      const component = this.$refs.yamleditor;

      if (component) {
        component.updateValue(value);
      }
    },

  }
};
</script>

<template>
  <div class="root resource-yaml flex-content">
    <YamlEditor
      ref="yamleditor"
      v-model:value="currentYaml"
      :mode="mode"
      :initial-yaml-values="initialYaml"
      class="yaml-editor flex-content"
      :editor-mode="editorMode"
      @onReady="onReady"
    />
    <slot
      name="yamlFooter"
      :currentYaml="currentYaml"
      :showPreview="showPreview"
      :yamlPreview="preview"
      :yamlSave="save"
      :yamlUnpreview="unpreview"
      :canDiff="canDiff"
    >
      <Footer
        v-if="showFooter"
        class="footer"
        :class="{ 'edit': !isView }"
        :mode="mode"
        :errors="errors"
        @save="save"
        @done="done"
      >
        <template
          v-if="!isView"
          #left
        >
          <FileSelector
            class="btn role-secondary"
            :label="t('generic.readFromFile')"
            @selected="onFileSelected"
          />
        </template>
        <template
          v-if="!isView"
          #middle
        >
          <button
            v-if="showPreview"
            type="button"
            class="btn role-secondary"
            @click="unpreview"
          >
            <t k="resourceYaml.buttons.continue" />
          </button>
          <button
            v-else-if="offerPreview"
            :disabled="!canDiff"
            type="button"
            class="btn role-secondary"
            @click="preview"
          >
            <t k="resourceYaml.buttons.diff" />
          </button>
        </template>
      </Footer>
    </slot>
  </div>
</template>

<style lang='scss' scoped>
  .flex-content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .footer {
    margin-top: 20px;
    right: 0;
    position: sticky;
    bottom: 0;
    background-color: var(--header-bg);

    // Overrides outlet padding
    margin-left: -$space-m;
    margin-right: -$space-m;
    margin-bottom: -$space-m;
    padding: $space-s $space-m;

    &.edit {
      border-top: var(--header-border-size) solid var(--header-border);
    }
  }
</style>

<style lang="scss">
.resource-yaml {
  .yaml-editor {
    min-height: 200px;
  }

  footer .actions {
    text-align: right;
  }

  .spacer-small {
    padding: 0;
  }
}

</style>
