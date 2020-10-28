<script>
import jsyaml from 'js-yaml';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import Footer from '@/components/form/Footer';
import { ANNOTATIONS_TO_FOLD } from '@/config/labels-annotations';
import { ensureRegex } from '@/utils/string';

import {
  _CREATE,
  _VIEW,
  PREVIEW,
  _FLAGGED,
  _UNFLAG,
  _EDIT,
} from '@/config/query-params';
import { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@/mixins/child-hook';
import { exceptionToErrorsArray } from '../utils/error';

export default {
  components: {
    Footer,
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
      type:    Function,
      default: null
    },

    showFooter: {
      type:    Boolean,
      default: true
    },

    saveOverride: {
      type:    Function,
      default: null
    }
  },

  data() {
    // Initial load with a preview showing no diff isn't very useful
    this.$router.applyQuery({ [PREVIEW]: _UNFLAG });

    return {
      currentYaml:  this.yaml,
      showPreview:  false,
      errors:       null
    };
  },

  computed: {
    schema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

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
  },

  watch: {
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
    },

    onReady(cm) {
      if ( this.isEdit ) {
        cm.foldLinesMatching(/^status:\s*$/);
      }

      try {
        const parsed = jsyaml.safeLoad(this.currentYaml);
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
      this.showPreview = true;
      this.$router.applyQuery({ [PREVIEW]: _FLAGGED });
    },

    unpreview() {
      this.showPreview = false;
      this.$router.applyQuery({ [PREVIEW]: _UNFLAG });
    },

    async save(buttonDone) {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const yaml = this.value.yamlForSave(this.currentYaml) || this.currentYaml;
      let parsed, res;

      try {
        await this.$emit('apply-hooks', BEFORE_SAVE_HOOKS);

        if (this._isBeingDestroyed || this._isDestroyed) {
          return;
        }

        try {
          parsed = jsyaml.safeLoad(yaml);
        } catch (err) {
          return onError.call(this, err);
        }

        if (this.saveOverride) {
          await this.saveOverride(parsed, this.value);
        } else {
          if ( this.schema?.attributes?.namespaced && !parsed.metadata.namespace ) {
            const err = this.$store.getters['i18n/t']('resourceYaml.errors.namespaceRequired');

            return onError.call(this, err);
          }

          if ( this.isCreate ) {
            res = await this.schema.followLink('collection', {
              method:  'POST',
              headers: {
                'content-type': 'application/yaml',
                accept:         'application/json',
              },
              data: yaml
            });
          } else {
            const link = this.value.hasLink('rioupdate') ? 'rioupdate' : 'update';

            res = await this.value.followLink(link, {
              method:  'PUT',
              headers: {
                'content-type': 'application/yaml',
                accept:         'application/json',
              },
              data: yaml
            });
          }

          if ( res && res.kind !== 'Table') {
            await this.$store.dispatch(`${ inStore }/load`, { data: res, existing: (this.isCreate ? this.value : undefined) });
          }
        }

        await this.$emit('apply-hooks', AFTER_SAVE_HOOKS);
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
        return this.doneOverride();
      }
      if ( !this.doneRoute ) {
        return;
      }
      this.$router.replace({
        name:   this.doneRoute,
        params: { resource: this.value.type }
      });
    }
  }
};
</script>

<template>
  <div class="root resource-yaml">
    <YamlEditor
      ref="yamleditor"
      v-model="currentYaml"
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
            :disabled="yaml === currentYaml"
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
