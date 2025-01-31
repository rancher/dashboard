<script>
import { KEYMAP } from '@shell/store/prefs';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export const CODEMIRROR_FOCUS_TRIGGER = '.CodeMirror.CodeMirror-wrap > div > textarea';
const CODEMIRROR_CONTAINER_SELECTOR = '#code-mirror-container';

export default {
  name: 'CodeMirror',

  emits: ['onReady', 'onInput', 'onChanges', 'onFocus', 'validationChanged'],

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
      hasLintErrors:   false,
      currFocusedElem: undefined
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
        styleActiveLine:         false,
        lineWrapping:            true,
        foldGutter:              true,
        styleSelectedText:       true,
        showCursorWhenSelecting: true,
        autocorrect:             false,
      };

      if (this.asTextArea) {
        out.lineNumbers = false;
        out.foldGutter = false;
        out.tabSize = 0;
        out.extraKeys = { Tab: false };
      }

      Object.assign(out, this.options);

      // parent components control lint with a boolean; if linting is enabled, we need to override that boolean with a custom error handler to wire lint errors into dashboard validation
      if (this.options?.lint) {
        out.lint = { onUpdateLinting: this.handleLintErrors };
      }

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
    },

    isCodeMirrorFocused() {
      return this.currFocusedElem === document.querySelector(CODEMIRROR_FOCUS_TRIGGER);
    },

    isCodeMirrorContainerFocused() {
      return this.currFocusedElem === document.querySelector(CODEMIRROR_CONTAINER_SELECTOR);
    },

    codeMirrorContainerTabIndex() {
      return this.isCodeMirrorFocused ? 0 : -1;
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

  async mounted() {
    document.addEventListener('keyup', this.handleKeyPress);
    document.addEventListener('focusin', this.focusChanged);
  },

  beforeUnmount() {
    document.removeEventListener('keyup', this.handleKeyPress);
    document.removeEventListener('focusin', this.focusChanged);
  },

  watch: {
    hasLintErrors(neu) {
      this.$emit('validationChanged', !neu);
    },

    isCodeMirrorContainerFocused: {
      handler(neu) {
        const codeMirrorEl = document.querySelector(CODEMIRROR_FOCUS_TRIGGER);

        if (codeMirrorEl) {
          codeMirrorEl.tabIndex = neu ? -1 : 0;
        }
      },
      immediate: true
    }
  },

  methods: {
    focusChanged(ev) {
      this.currFocusedElem = ev.target;
    },

    handleKeyPress(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      // make focus leave the editor for it's parent container so that we can tab
      if (this.isCodeMirrorFocused && ev.code === 'Escape') {
        document.querySelector(CODEMIRROR_CONTAINER_SELECTOR).focus();
      }

      // if parent container is focused and we press a trigger, focus goes to the editor inside
      if (this.isCodeMirrorContainerFocused && (ev.code === 'Enter' || ev.code === 'Space')) {
        document.querySelector(CODEMIRROR_FOCUS_TRIGGER).focus();
      }
    },
    /**
     * Codemirror yaml linting uses js-yaml parse
     * it does not distinguish between warnings and errors so we will treat all yaml lint messages as errors
     * other codemirror linters (eg json) will report from, to, severity where severity may be 'warning' or 'error'
     * only 'error' level linting will trigger a validation event from this component
    */
    handleLintErrors(diagnostics = []) {
      const hasLintErrors = diagnostics.filter((d) => !d.severity || d.severity === 'error').length > 0;

      this.hasLintErrors = hasLintErrors;
    },

    focus() {
      if ( this.$refs.codeMirrorRef ) {
        this.$refs.codeMirrorRef.cminstance.focus();
      }
    },

    refresh() {
      if ( this.$refs.codeMirrorRef ) {
        this.$refs.codeMirrorRef.refresh();
      }
    },

    onReady(codeMirrorRef) {
      this.$emit('validationChanged', true);

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
        this.$refs.codeMirrorRef.cminstance.doc.setValue(value);
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
    id="code-mirror-container"
    :tabindex="codeMirrorContainerTabIndex"
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
      <Codemirror
        id="code-mirror-el"
        ref="codeMirrorRef"
        :value="value"
        :options="combinedOptions"
        :disabled="isDisabled"
        :original-style="true"
        @ready="onReady"
        @input="onInput"
        @changes="onChanges"
        @focus="onFocus"
        @blur="onBlur"
      />
      <span
        v-show="isCodeMirrorFocused"
        class="escape-text"
        role="comment"
        :aria-describedby="t('wm.containerShell.escapeText')"
      >{{ t('codeMirror.escapeText') }}</span>
    </div>
    <div v-else>
      Loading...
    </div>
  </div>
</template>

<style lang="scss">
  $code-mirror-animation-time: 0.1s;

  .escape-text {
    font-size: 12px;
  }

  .code-mirror {
    &#code-mirror-container:focus-visible {
      @include focus-outline;
    }

    &.as-text-area .codemirror-container{
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

      .CodeMirror-gutters .CodeMirror-foldgutter:empty {
        display: none;
      }
    }
  }

  .code-mirror {
    position: relative;

    .codemirror-container {
      z-index: 0;
      font-size: inherit !important;

      //rm no longer extant selector
      .CodeMirror {
        height: initial;
        background: none
      }

      .CodeMirror-gutters {
        background: inherit;
      }
    }

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
  }

</style>
