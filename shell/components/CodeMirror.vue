<script>
import { KEYMAP } from '@shell/store/prefs';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
  name:  'CodeMirror',
  props: {
    /**
     * Sets the edit mode for Text Area.
     * @values _EDIT, _VIEW
     */
    mode: {
      type:    String,
      default: _EDIT
    },
    value: {
      type:     String,
      required: true,
    },
    options: {
      type:    Object,
      default: () => {}
    },
  },

  data() {
    return {
      cm:     null,
      loaded: false
    };
  },

  computed: {

    isDisabled() {
      return this.mode === _VIEW;
    },

    combinedOptions() {
      const theme = this.$store.getters['prefs/theme'];
      const keymap = this.$store.getters['prefs/get'](KEYMAP);

      const out = {
        // codemirror default options
        tabSize:                 2,
        indentWithTabs:          false,
        mode:                    'yaml',
        keyMap:                  keymap,
        theme:                   `base16-${ theme }`,
        lineNumbers:             true,
        line:                    true,
        styleActiveLine:         true,
        lineWrapping:            true,
        foldGutter:              true,
        styleSelectedText:       true,
        showCursorWhenSelecting: true,
      };

      Object.assign(out, this.options);

      return out;
    },
    markdownLineBreaks() {
      return this.cm?.options.showMarkdownLineBreaks || false;
    }
  },

  created() {
    if (window.__codeMirrorLoader) {
      window.__codeMirrorLoader().then(() => {
        this.loaded = true;
      });
    } else {
      console.error('Code mirror loader not available'); // eslint-disable-line no-console
    }
  },

  methods: {

    focus() {
      if ( this.$refs.cm ) {
        this.$refs.cm.codemirror.focus();
      }
    },

    refresh() {
      if ( this.$refs.cm ) {
        this.$refs.cm.refresh();
      }
    },

    onReady(cm) {
      this.$nextTick(() => {
        cm.refresh();
        this.cm = cm;
      });
      this.$emit('onReady', cm);
    },

    onInput(newCode) {
      this.$emit('onInput', newCode);
    },

    onChanges(cm, changes) {
      this.$emit('onChanges', cm, changes);
    },

    onFocus() {
      this.$emit('onFocus', true);
    },

    onBlur() {
      this.$emit('onFocus', false);
    },

    updateValue(value) {
      if ( this.$refs.cm ) {
        this.$refs.cm.codemirror.doc.setValue(value);
      }
    }
  }
};
</script>

<template>
  <client-only placeholder=" Loading...">
    <div
      class="code-mirror"
      :class="{['cm-markdown-line-breaks']: markdownLineBreaks}"
    >
      <codemirror
        v-if="loaded"
        ref="cm"
        :value="value"
        :options="combinedOptions"
        :disabled="isDisabled"
        @ready="onReady"
        @input="onInput"
        @changes="onChanges"
        @focus="onFocus"
        @blur="onBlur"
      />
      <div v-else>
        Loading...
      </div>
    </div>
  </client-only>
</template>

<style lang="scss">
  .code-mirror {
    z-index: 0;

    .vue-codemirror .CodeMirror {
      height: initial;
      background: none
    }

    // 'showMarkdownLineBreaks' mode, defined in shell/plugins/codemirror.js
    &.cm-markdown-line-breaks {
      .CodeMirror-wrap pre {
        word-break: break-word;
      }
      .CodeMirror-code {
        .CodeMirror-line {
          &:not(:last-child)>span:after,
          .cm-markdown-single-trailing-space-odd:before,
          .cm-markdown-single-trailing-space-even:before {
            color: var(--muted);
            position: absolute;
            line-height: 20px;
            pointer-events: none;
          }
          &:not(:last-child)>span:after {
            content: '↵';
            margin-left: 2px;
          }
          .cm-markdown-single-trailing-space-odd:before,
          .cm-markdown-single-trailing-space-even:before {
            font-weight: bold;
            content: '·';
          }
        }
      }
    }
  }

</style>
