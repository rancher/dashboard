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
      codeMirrorRef:   null,
      loaded:          false,
      removeKeyMapBox: false,
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

    keyMapTooltip() {
      if (this.combinedOptions?.keyMap) {
        const name = this.t(`prefs.keymap.${ this.combinedOptions.keyMap }`);

        return this.t('codeMirror.keymap.indicatorToolip', { name });
      }

      return null;
    },

    isNonDefaultKeyMap() {
      return this.combinedOptions?.keyMap !== 'sublime';
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
        v-if="showKeyMapBox && !removeKeyMapBox && keyMapTooltip && isNonDefaultKeyMap"
        class="keymap overlay"
      >
        <div
          v-clean-tooltip="keyMapTooltip"
          class="keymap-indicator"
          data-testid="code-mirror-keymap"
          @click="closeKeyMapInfo"
        >
          <i class="icon icon-keyboard keymap-icon" />
          <div class="close-indicator">
            <i class="icon icon-close icon-sm" />
          </div>
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
  $code-mirror-animation-time: 0.1s;

  .code-mirror {
    z-index: 0;

    // Keyboard mapping overlap
    .keymap.overlay {
      position: absolute;
      display: flex;
      top: 7px;
      right: 7px;
      z-index: 1;
      cursor: pointer;

      .keymap-indicator {
        width: 48px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        color: var(--darker);
        background-color: var(--overlay-bg);
        font-size: 12px;

        .close-indicator {
          width: 0;

          .icon-close {
            color: var(--primary);
            opacity: 0;
          }
        }

        .keymap-icon {
          font-size: 24px;
          opacity: 0.8;
          transition: margin-right $code-mirror-animation-time ease-in-out;
        }

        &:hover {
          border: 1px solid var(--primary);
          border-radius: var(--border-radius);;

          .close-indicator {
            margin-left: -6px;
            width: auto;

            .icon-close {
              opacity: 1;
              transition: opacity $code-mirror-animation-time ease-in-out $code-mirror-animation-time; // Only animate when being shown
            }
          }

          .keymap-icon {
            opacity: 0.6;
            margin-right: 10px;
          }
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
