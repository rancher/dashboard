<script lang="ts">
import { defineComponent, markRaw, PropType, toRaw } from 'vue';
import jsyaml from 'js-yaml';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
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
      view:                   null as EditorView | null,
      removeKeyMapBox:        false,
      hasLintErrors:          false,
      currFocusedElem:        undefined as EventTarget | undefined | null,
      isCodeMirrorFocused:    false,
      codeMirrorContainerRef: undefined as HTMLElement | undefined
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

    combinedExtensions(): Extension[] {
      // Extensions must not be reactive proxies, CodeMirror compares them by identity
      const out: Extension[] = this.extensions.map((e) => toRaw(e));

      // Tab indents, as with a regular code editor. Text areas leave tab to move focus
      if (!this.asTextArea) {
        out.push(keymap.of([indentWithTab]));
      }

      if (this.options?.screenReaderLabel) {
        out.push(EditorView.contentAttributes.of({ 'aria-label': this.options.screenReaderLabel }));
      }

      return out;
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

    isCodeMirrorContainerFocused(): boolean {
      return this.currFocusedElem === this.codeMirrorContainerRef;
    },

    codeMirrorContainerTabIndex(): number {
      return this.isCodeMirrorFocused ? 0 : -1;
    }
  },

  mounted() {
    const el = this.$refs.codeMirrorContainer as HTMLElement;

    el.addEventListener('keydown', this.handleKeyPress);
    this.codeMirrorContainerRef = el;
  },

  beforeUnmount() {
    const el = this.$refs.codeMirrorContainer as HTMLElement;

    el.removeEventListener('keydown', this.handleKeyPress);
  },

  watch: {
    hasLintErrors(neu) {
      this.$emit('validationChanged', !neu);
    },

    value(neu) {
      this.lint(neu);
    },

    isCodeMirrorContainerFocused: {
      handler(neu) {
        const codeMirrorEl = this.view?.contentDOM;

        if (codeMirrorEl) {
          codeMirrorEl.tabIndex = neu ? -1 : 0;
        }
      },
      immediate: true
    }
  },

  methods: {
    focusChanged(ev: FocusEvent, isBlurred = false) {
      if (isBlurred) {
        this.currFocusedElem = undefined;
      } else {
        this.currFocusedElem = ev.target;
      }
    },

    handleKeyPress(ev: KeyboardEvent) {
      // allows pressing escape in the editor, useful for modal editing with vim
      if (this.isCodeMirrorFocused && ev.code === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
      }

      // make focus leave the editor for it's parent container so that we can tab
      const didPressEscapeSequence = ev.shiftKey && ev.code === 'Escape';

      if (this.isCodeMirrorFocused && didPressEscapeSequence) {
        (this.$refs.codeMirrorContainer as HTMLElement | undefined)?.focus();
      }

      // if parent container is focused and we press a trigger, focus goes to the editor inside
      if (this.isCodeMirrorContainerFocused && (ev.code === 'Enter' || ev.code === 'Space')) {
        ev.preventDefault();
        this.view?.focus();
      }
    },

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
      this.isCodeMirrorFocused = true;
      this.$emit('onFocus', true);
    },

    onBlur() {
      this.isCodeMirrorFocused = false;
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
    ref="codeMirrorContainer"
    :tabindex="codeMirrorContainerTabIndex"
    class="code-mirror code-mirror-container"
    :class="{['read-only']: isReadOnly}"
    @focusin="focusChanged"
    @blur="focusChanged($event, true)"
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
        @ready="onReady"
        @update:model-value="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
    <span
      v-show="isCodeMirrorFocused"
      class="escape-text"
      role="alert"
      :aria-describedby="t('wm.containerShell.escapeText')"
    >{{ t('codeMirror.escapeText') }}</span>
  </div>
</template>

<style lang="scss">
  $code-mirror-animation-time: 0.1s;

  .code-mirror {
    position: relative;
    margin-bottom: 20px;

    &.code-mirror-container:focus-visible {
      @include focus-outline;
    }

    .escape-text {
      font-size: 12px;
      position: absolute;
      bottom: -20px;
      left: 0;
    }

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
