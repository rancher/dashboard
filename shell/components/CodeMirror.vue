<script lang="ts">
import { defineComponent, markRaw, PropType, toRaw } from 'vue';
import jsyaml from 'js-yaml';
import { EditorState, type Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { Diagnostic, LintSource } from '@codemirror/lint';
import { RcCodeMirror } from '@components/RcCodeMirror';
import type { RcCodeMirrorKeymap, RcCodeMirrorLanguage, RcCodeMirrorVariant } from '@components/RcCodeMirror';
import { KEYMAP } from '@shell/store/prefs';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { codeMirror5OptionExtensions, withCodeMirror5Api } from '@shell/utils/codemirror-compat';

type CodeMirrorMode = string | { name?: string, json?: boolean } | null;

export interface CodeMirrorOptions {
  /**
   * Language of the editor content. Defaults to yaml, `null` disables syntax highlighting.
   * Accepts `yaml`, `json`, `javascript` or `{ name: 'javascript', json: true }`.
   */
  mode?: CodeMirrorMode;
  readOnly?: boolean;
  /**
   * Validate the content as yaml and emit `validationChanged`. Editable editors also mark the problem
   */
  lint?: boolean;
  lineNumbers?: boolean;
  foldGutter?: boolean;
  lineWrapping?: boolean;
  screenReaderLabel?: string;
  /**
   * Deprecated CodeMirror 5 options. Some, such as `extraKeys` and `tabSize`, are translated to
   * CodeMirror 6 and the rest are ignored. Pass CodeMirror 6 extensions with `extensions` instead.
   */
  [option: string]: unknown;
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

  if (mode === 'javascript' || mode === 'text/javascript' || (typeof mode === 'object' && mode?.name === 'javascript')) {
    return 'javascript';
  }

  return undefined;
}

/**
 * Marks where js-yaml stopped parsing. Like the CodeMirror 5 yaml lint addon, only the first line of
 * the message is kept, the rest is a snippet of the document
 */
function yamlDiagnostic(error: unknown, docLength: number): Diagnostic {
  const { mark, message } = error as { mark?: { position?: number }, message?: string };
  const from = Math.min(Math.max(mark?.position ?? 0, 0), docLength);

  return {
    from,
    to:       from,
    severity: 'error',
    message:  (message || String(error)).split('\n')[0],
  };
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
      view:          null as EditorView | null,
      hasLintErrors: false,
      // The last value linted and the error it had, so the markers reuse the validation's parse
      lintedValue:   null as string | null,
      lintError:     null as unknown,
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

    // As in CodeMirror 5, only editable editors mark problems. Read-only content is still validated
    linter(): LintSource | undefined {
      if (!this.lintEnabled || this.isReadOnly) {
        return undefined;
      }

      return (view: EditorView) => {
        const value = view.state.doc.toString();

        if (value !== this.lintedValue) {
          this.lint(value);
        }

        return this.lintError ? [yamlDiagnostic(this.lintError, value.length)] : [];
      };
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
        // RcCodeMirror replaces `$` with the keymap name
        'Key mapping: $':                             this.t('codeMirror.keymap.indicatorToolip', { name: '$' }),
        'Hide key mapping: $':                        this.t('codeMirror.keymap.hideIndicator', { name: '$' }),
        Vim:                                          this.t('prefs.keymap.vim'),
        Emacs:                                        this.t('prefs.keymap.emacs'),
      });
    },

    combinedExtensions(): Extension[] {
      // Extensions must not be reactive proxies, CodeMirror compares them by identity
      return [
        this.phrases,
        ...codeMirror5OptionExtensions(toRaw(this.options)),
        ...this.extensions.map((e) => toRaw(e))
      ];
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
      if (!this.lintEnabled || value === this.lintedValue) {
        return;
      }

      try {
        jsyaml.loadAll(value || '', () => {});
        this.lintError = null;
      } catch (e) {
        this.lintError = e;
      }
      this.lintedValue = value;
      this.hasLintErrors = !!this.lintError;
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
      // Handlers written for CodeMirror 5 still call its methods on the view
      this.$emit('onReady', withCodeMirror5Api(view));
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
  }
});
</script>

<template>
  <div class="code-mirror code-mirror-container">
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
        :keymap-indicator="showKeyMapBox"
        :linter="linter"
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
  .code-mirror {
    position: relative;
    margin-bottom: 20px;

    .codemirror-container {
      z-index: 0;
      font-size: inherit !important;
    }

    // Once an extension built with an older shell shows a CodeMirror 5 editor, codemirror-editor-vue3 adds a
    // global .codemirror-container rule that shrinks this wrapper to its content, see plugins/codemirror-loader.js
    > .codemirror-container {
      display: block;
      width: auto;
      height: auto;
      overflow: visible;
    }
  }
</style>
