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
    asTextArea: {
      type:    Boolean,
      default: false
    },
    showKeyMapBox: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return {
      codeMirrorRef:       null,
      loaded:              false,
      showKeyMapCloseIcon: false,
      removeKeyMapBox:     false,
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

      if (this.asTextArea) {
        out.lineNumbers = false;
        out.tabSize = 0;
        out.extraKeys = { Tab: false };
      }

      Object.assign(out, this.options);

      return out;
    },

    keyMapText() {
      return this.combinedOptions?.keyMap ? this.t(`prefs.keymap.${ this.combinedOptions.keyMap }`) : null;
    },
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
      if ( this.$refs.codeMirrorRef ) {
        this.$refs.codeMirrorRef.codemirror.focus();
      }
    },

    refresh() {
      if ( this.$refs.codeMirrorRef ) {
        this.$refs.codeMirrorRef.refresh();
      }
    },

    onReady(codeMirrorRef) {
      this.$nextTick(() => {
        codeMirrorRef.refresh();
        this.codeMirrorRef = codeMirrorRef;
      });
      this.$emit('onReady', codeMirrorRef);
    },

    onInput(newCode) {
      this.$emit('onInput', newCode);
    },

    onChanges(codeMirrorRef, changes) {
      this.$emit('onChanges', codeMirrorRef, changes);
    },

    onFocus() {
      this.$emit('onFocus', true);
    },

    onBlur() {
      this.$emit('onFocus', false);
    },

    updateValue(value) {
      if ( this.$refs.codeMirrorRef ) {
        this.$refs.codeMirrorRef.codemirror.doc.setValue(value);
      }
    },

    closeKeyMapInfo() {
      this.removeKeyMapBox = true;
    },

    onKeyMapMouseOver(v) {
      this.showKeyMapCloseIcon = v;
    }
  }
};
</script>

<template>
  <div
    class="code-mirror"
    :class="{['as-text-area']: asTextArea}"
  >
    <div v-if="loaded">
      <div
        v-if="showKeyMapBox && !removeKeyMapBox && keyMapText"
        class="keymap overlay"
      >
        <div
          v-clean-tooltip="t('codeMirror.keymap.tooltip')"
          class="label"
          data-testid="code-mirror-keymap"
          @mouseover="onKeyMapMouseOver(true)"
          @mouseleave="onKeyMapMouseOver(false)"
        >
          <span>
            {{ keyMapText }}
          </span>
          <i
            v-if="showKeyMapCloseIcon"
            class="icon icon-close icon-sm"
            @click="closeKeyMapInfo"
          />
        </div>
      </div>
      <codemirror
        ref="codeMirrorRef"
        :value="value"
        :options="combinedOptions"
        :disabled="isDisabled"
        @ready="onReady"
        @input="onInput"
        @changes="onChanges"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
    <div v-else>
      Loading...
    </div>
  </div>
</template>

<style lang="scss">
  .code-mirror {
    z-index: 0;

    .overlay {
      position: sticky;
      display: grid;
      top: 0;
      float: right;
      height: 0;
      z-index: 1;

      .label {
        border-radius: 2px;
        border-style: dashed;
        border-width: 0.1px;
        margin: 7px 7px 0 0;
        padding: 7px;
        color: var(--darker);
        background-color: var(--overlay-bg);
        font-size: 12px;

        .icon {
          cursor: pointer;
        }
      }
    }

    .vue-codemirror .CodeMirror {
      height: initial;
      background: none
    }

    &.as-text-area {
      min-height: 40px;
      position: relative;
      display: block;
      box-sizing: border-box;
      width: 100%;
      padding: 10px;
      background-color: var(--input-bg);
      border-radius: var(--border-radius);
      border: solid var(--border-width) var(--input-border);
      color: var(--input-text);

      &:hover {
        border-color: var(--input-hover-border);
      }

      &:focus, &.focus {
        outline: none;
        border-color: var(--outline);
      }

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

      .CodeMirror-lines {
        color: var(--input-text);
        padding: 0;

        .CodeMirror-line > span > span {
          &.cm-overlay {
            font-family: monospace;
          }
        }

        .CodeMirror-line > span {
          font-family: $body-font;
        }
      }

      .CodeMirror-sizer {
        min-height: 20px;
      }

      .CodeMirror-selected {
        background-color: var(--primary) !important;
      }

      .CodeMirror-selectedtext {
        color: var(--primary-text);
      }

      .CodeMirror-line::selection,
      .CodeMirror-line > span::selection,
      .CodeMirror-line > span > span::selection {
        color: var(--primary-text);
        background-color: var(--primary);
      }

      .CodeMirror-line::-moz-selection,
      .CodeMirror-line > span::-moz-selection,
      .CodeMirror-line > span > span::-moz-selection {
        color: var(--primary-text);
        background-color: var(--primary);
      }
    }
  }
</style>
