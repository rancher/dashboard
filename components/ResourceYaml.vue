<script>
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import Footer from '@/components/form/Footer';

import {
  _CREATE,
  _VIEW,
  PREVIEW,
  _FLAGGED,
  _UNFLAG,
} from '@/config/query-params';

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

    model: {
      type:     Object,
      required: true,
    },

    value: {
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
  },

  data() {
    // Initial load with a preview showing no diff isn't very useful
    this.$router.applyQuery({ [PREVIEW]: _UNFLAG });

    return {
      currentValue: this.value,
      showPreview:  false,
      errors:       null
    };
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.model.type);
    },

    cmOptions() {
      const readOnly = this.mode === _VIEW;
      const gutters = ['CodeMirror-lint-markers'];

      if ( !readOnly ) {
        gutters.push('CodeMirror-foldgutter');
      }

      return {
        readOnly,
        gutters,
        mode:            'yaml',
        lint:            true,
        lineNumbers:     !readOnly,
        extraKeys:       { 'Ctrl-Space': 'autocomplete' },
        cursorBlinkRate: ( readOnly ? -1 : 530 )
      };
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isView() {
      return this.mode === _VIEW;
    },

    editorMode() {
      return this.showPreview
        ? EDITOR_MODES.DIFF_CODE
        : EDITOR_MODES.EDIT_CODE;
    },
  },

  methods: {
    onInput(value) {
      this.currentValue = value;
    },

    onReady(cm) {
      cm.getMode().fold = 'yaml';

      if ( this.isCreate ) {
        cm.execCommand('foldAll');
      }
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

    readFromFile() {
      this.$refs.yamleditor.readFromFile();
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
      try {
        if ( this.isCreate ) {
          await this.schema.followLink('collection', {
            method:  'POST',
            headers: {
              'content-type': 'application/yaml',
              accept:         'application/json',
            },
            data: this.currentValue,
          });
        } else {
          const link = this.model.hasLink('rioupdate') ? 'rioupdate' : 'update';

          await this.model.followLink(link, {
            method:  'PUT',
            headers: {
              'content-type': 'application/yaml',
              accept:         'application/json',
            },
            data: this.currentValue,
          });
        }

        buttonDone(true);
        this.done();
      } catch (err) {
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
        params: { resource: this.model.type }
      });
    }
  }
};
</script>

<template>
  <div class="root resource-yaml">
    <YamlEditor
      ref="yamleditor"
      v-model="currentValue"
      class="yaml-editor"
      :editor-mode="editorMode"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <Footer v-if="!isView" :mode="mode" :errors="errors" @save="save" @done="done">
      <template #middle>
        <button v-if="showPreview" type="button" class="btn role-secondary" @click="unpreview">
          Continue Editing
        </button>
        <button v-else-if="offerPreview" :disabled="value === currentValue" type="button" class="btn role-secondary" @click="preview">
          Show Diff
        </button>
      </template>
    </Footer>
  </div>
</template>

<style lang="scss">
.resource-yaml {
  flex: 1;
  display: flex;
  flex-direction: column;

  .yaml-editor {
    flex: 1;
    min-height: 200px;
  }

  footer .actions {
    text-align: center;
  }
}
</style>
