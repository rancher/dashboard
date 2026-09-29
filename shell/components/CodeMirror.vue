<script lang="ts">
import { defineComponent, markRaw, PropType, toRaw } from 'vue';
import jsyaml from 'js-yaml';
import { EditorState, type Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { RcCodeMirror } from '@components/RcCodeMirror';
import type { RcCodeMirrorKeymap, RcCodeMirrorLanguage, RcCodeMirrorVariant } from '@components/RcCodeMirror';
import { KEYMAP } from '@shell/store/prefs';
import { _EDIT, _VIEW } from '@shell/config/query-params';

type CodeMirrorMode = string | { name?: string, json?: boolean } | null;

export interface CodeMirrorOptions {
  /**
   * Language of the editor content. Defaults to yaml, `null` disables syntax highlighting.
   * Accepts `yaml`, `json` or `{ name: 'javascript', json: true }`.
   */
  mode?: CodeMirrorMode;
  readOnly?: boolean;
  /**
   * Validate the content as yaml and emit `validationChanged`
   */
  lint?: boolean;
  lineNumbers?: boolean;
  foldGutter?: boolean;
  lineWrapping?: boolean;
  screenReaderLabel?: string;
}

// Maps the dashboard keymap preference to the keymaps supported by RcCodeMirror
const KEYMAP_PREFS: Record<string, RcCodeMirrorKeymap> = {
  sublime: 'default',
  vim:     'vim',
  emacs:   'emacs',
};

function toLanguage(mode: CodeMirrorMode): RcCodeMirrorLanguage | undefined {
  if (mode === 'yaml' || mode === 'text/x-yaml') {
    return 'yaml';
  }

  if (mode === 'json' || mode === 'application/json' || (typeof mode === 'object' && mode?.json)) {
    return 'json';
  }

  return undefined;
}

export default defineComponent({
  name: 'CodeMirror',

  components: { RcCodeMirror },

  emits: ['onReady', 'onInput', 'onFocus', 'validationChanged'],

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
      type:    Object as PropType<CodeMirrorOptions>,
      default: () => ({})
    },
    /**
     * Additional CodeMirror extensions. Only read on mount.
     */
    extensions: {
      type:    Array as PropType<Extension[]>,
      default: () => []
    },
    /**
     * Display as a multi-line form input rather than a code editor, see RcCodeMirror's `input` variant
     */
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
      view:            null as EditorView | null,
      removeKeyMapBox: false,
      hasLintErrors:   false,
    };
  },

  computed: {
    isDisabled(): boolean {
      return this.mode === _VIEW;
    },

    isReadOnly(): boolean {
      return this.isDisabled || !!this.options?.readOnly;
    },

    language(): RcCodeMirrorLanguage | undefined {
      return toLanguage(this.options && 'mode' in this.options ? this.options.mode as CodeMirrorMode : 'yaml');
    },

    lintEnabled(): boolean {
      return !!this.options?.lint && this.language === 'yaml';
    },

    variant(): RcCodeMirrorVariant {
      return this.asTextArea ? 'input' : 'editor';
    },

    lineNumbers(): boolean {
      return this.options?.lineNumbers ?? true;
    },

    foldGutter(): boolean {
      return this.options?.foldGutter ?? true;
    },

    lineWrapping(): boolean {
      return this.options?.lineWrapping ?? true;
    },

    keymapPref(): string {
      return this.$store.getters['prefs/get'](KEYMAP);
    },

    keymap(): RcCodeMirrorKeymap {
      return KEYMAP_PREFS[this.keymapPref] || 'default';
    },

    // Translates the text RcCodeMirror renders itself. Like the other extensions, only read on mount
    phrases(): Extension {
      return EditorState.phrases.of({
        'Fold line':                                  this.t('codeMirror.foldLine'),
        'Unfold line':                                this.t('codeMirror.unfoldLine'),
        'Press Escape, then Tab to leave the editor': this.t('codeMirror.escapeText'),
      });
    },

    combinedExtensions(): Extension[] {
      // Extensions must not be reactive proxies, CodeMirror compares them by identity
      return [this.phrases, ...this.extensions.map((e) => toRaw(e))];
    },

    keyMapTooltip(): string | null {
      if (this.keymapPref) {
        const name = this.t(`prefs.keymap.${ this.keymapPref }`);

        return this.t('codeMirror.keymap.indicatorToolip', { name });
      }

      return null;
    },

    isNonDefaultKeyMap(): boolean {
      return !!this.keymapPref && this.keymapPref !== 'sublime';
    },
  },

  watch: {
    hasLintErrors(neu) {
      this.$emit('validationChanged', !neu);
    },

    value(neu) {
      this.lint(neu);
    },
  },

  methods: {
    /**
     * Validates yaml content with js-yaml, treating every parse failure as an error
     */
    lint(value: string) {
      if (!this.lintEnabled) {
        return;
      }

      try {
        jsyaml.loadAll(value || '', () => {});
        this.hasLintErrors = false;
      } catch (e) {
        this.hasLintErrors = true;
      }
    },

    focus() {
      this.view?.focus();
    },

    /**
     * CodeMirror 6 measures itself, retained for components that call refresh when an editor is revealed
     */
    refresh() {
      this.view?.requestMeasure();
    },

    onReady(view: EditorView) {
      this.view = markRaw(view);

      this.$emit('validationChanged', true);
      this.lint(this.value);
      this.$emit('onReady', view);
    },

    onInput(value: string) {
      this.lint(value);
      this.$emit('onInput', value);
    },

    onFocus() {
      this.$emit('onFocus', true);
    },

    onBlur() {
      this.$emit('onFocus', false);
    },

    updateValue(value: string) {
      const view = this.view;

      if (!view || view.state.doc.toString() === value) {
        return;
      }

      view.dispatch({
        changes: {
          from: 0, to: view.state.doc.length, insert: value || ''
        }
      });
    },

    closeKeyMapInfo() {
      this.removeKeyMapBox = true;
    },
  }
});
</script>

<template>
  <div
    class="code-mirror code-mirror-container"
    :class="{['read-only']: isReadOnly}"
  >
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
    <div class="codemirror-container">
      <RcCodeMirror
        :model-value="value"
        :language="language"
        :keymap="keymap"
        theme="rancher"
        :variant="variant"
        :read-only="isReadOnly"
        :line-numbers="lineNumbers"
        :fold-gutter="foldGutter"
        :line-wrapping="lineWrapping"
        :extensions="combinedExtensions"
        :aria-label="options.screenReaderLabel"
        @ready="onReady"
        @update:model-value="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
  </div>
</template>

<style lang="scss">
  $code-mirror-animation-time: 0.1s;

  .code-mirror {
    position: relative;
    margin-bottom: 20px;

    .codemirror-container {
      z-index: 0;
      font-size: inherit !important;

      .rc-code-mirror--editor .cm-editor {
        .cm-scroller {
          font-family: $mono-font;
        }
      }
    }

    &.read-only .cm-cursor {
      display: none !important;
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
        background-color: var(--subtle-overlay-bg);
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
