<script>
import jsyaml from 'js-yaml';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import Footer from '@shell/components/form/Footer';
import { ANNOTATIONS_TO_FOLD } from '@shell/config/labels-annotations';
import { ensureRegex } from '@shell/utils/string';

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
      type:    String,
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
      if ( this.isView ) {
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
        const regexes = ANNOTATIONS_TO_FOLD.map(x => ensureRegex(x));

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

      // regardless of edit or create we should probably fold all the comments so they dont get out of hand.
      const saved = cm.getMode().fold;

      cm.getMode().fold = 'yamlcomments';
      cm.execCommand('foldAll');
      cm.getMode().fold = saved;
    },

    onChanges(cm, changes) {
      if ( changes.length !== 1 ) {
        return;
      }

      const change = changes[0];

      if ( change.from.line !== change.to.line ) {
        return;
      }

      let line = change.from.line;
      let str = cm.getLine(line);
      let maxIndent = indentChars(str);

      if ( maxIndent === null ) {
        return;
      }

      cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

      while ( line > 0 ) {
        line--;
        str = cm.getLine(line);
        const indent = indentChars(str);

        if ( indent === null ) {
          break;
        }

        if ( indent < maxIndent ) {
          cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

          if ( indent === 0 ) {
            break;
          }

          maxIndent = indent;
        }
      }

      function indentChars(str) {
        const match = str.match(/^#(\s+)/);

        if ( match ) {
          return match[1].length;
        }

        return null;
      }
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
  <div class="root resource-yaml">
    <YamlEditor
      ref="yamleditor"
      v-model="currentYaml"
      :initial-yaml-values="initialYaml"
      class="yaml-editor"
      :editor-mode="editorMode"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <slot
      name="yamlFooter"
      :currentYaml="currentYaml"
      :showPreview="showPreview"
      :yamlPreview="preview"
      :yamlSave="save"
      :yamlUnpreview="unpreview"
    >
      <Footer
        v-if="showFooter"
        :mode="mode"
        :errors="errors"
        @save="save"
        @done="done"
      >
        <template v-if="!isView" #left>
          <FileSelector
            class="btn role-secondary"
            :label="t('generic.readFromFile')"
            @selected="onFileSelected"
          />
        </template>
        <template v-if="!isView" #middle>
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

<style lang="scss">
.resource-yaml {
  .yaml-editor {
    min-height: 200px;
  }

  footer .actions {
    text-align: right;
  }
}
</style>
