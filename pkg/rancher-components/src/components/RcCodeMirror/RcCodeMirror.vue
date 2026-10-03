<script setup lang="ts">
/**
 * A code editor built on CodeMirror 6 with YAML and JSON support, swappable
 * keymaps (default, vim, emacs) and configurable code folding. Every prop can
 * change after mount without rebuilding the editor.
 *
 * Example:
 *
 * <RcCodeMirror v-model="yaml" language="yaml" />
 *
 * <RcCodeMirror v-model="value" variant="input" />
 *
 * <RcCodeMirror
 *   v-model="yaml"
 *   language="yaml"
 *   keymap="vim"
 *   :read-only="false"
 *   :line-wrapping="true"
 *   :fold-options="{ strategy: 'indent' }"
 *   :extensions="[foldByYamlPath('metadata.labels')]"
 *   @ready="(view) => foldYamlPath(view, 'metadata.labels')"
 * />
 *
 * The underlying EditorView is emitted with `ready` and exposed as `view` on
 * the component ref for anything the props do not cover.
 *
 * ARIA attributes (e.g. `aria-label`, `aria-labelledby`) and `tabindex` are
 * forwarded to the editor's textbox. Give every instance an accessible name.
 * In the editor variant, Tab indents at the cursor (or indents the selected
 * lines) and Shift-Tab unindents with the default keymap and in Vim Insert mode.
 * Emacs Tab reindents the line. In Vim Normal mode Tab moves through the jump
 * list and Shift-Tab does nothing. Press Escape then Tab to move focus out.
 * In a read-only editor Tab and Shift-Tab move focus with every keymap.
 */
import {
  ref, shallowRef, computed, onMounted, onBeforeUnmount, watch, useAttrs
} from 'vue';
import type { Extension } from '@codemirror/state';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLineGutter,
  highlightSpecialChars,
  rectangularSelection,
  crosshairCursor,
  lineNumbers as cmLineNumbers
} from '@codemirror/view';
import { history } from '@codemirror/commands';
import {
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter as cmFoldGutter
} from '@codemirror/language';
import { closeBrackets, autocompletion } from '@codemirror/autocomplete';
import { linter as cmLinter, lintGutter, type LintSource } from '@codemirror/lint';
import RcButton from '@components/RcButton/RcButton.vue';
import { getLanguageExtension } from './extensions/syntax';
import { getKeymapExtension } from './extensions/keymaps';
import { buildFoldExtension } from './extensions/fold';
import { bottomPanelsExtension } from './extensions/panels';
import { rancherInputTheme, rancherTheme } from './extensions/theme';
import type { RcCodeMirrorKeymap, RcCodeMirrorProps, RcCodeMirrorTheme, RcCodeMirrorVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RcCodeMirrorProps>(), {
  modelValue:      '',
  language:        undefined,
  keymap:          undefined,
  theme:           'rancher',
  variant:         'editor',
  readOnly:        false,
  lineNumbers:     true,
  foldGutter:      true,
  lineWrapping:    false,
  extensions:      undefined,
  foldOptions:     undefined,
  linter:          undefined,
  keymapIndicator: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
  'focus': [view: EditorView];
  'blur': [view: EditorView];
  'ready': [view: EditorView];
}>();

const attrs = useAttrs();
const container = ref<HTMLDivElement>();
const bottomPanels = ref<HTMLDivElement>();
const view = shallowRef<EditorView>();
const isEditorFocused = ref(false);
const ESCAPE_HINT = 'Press Escape, then Tab to leave the editor';
let initialState: EditorState | undefined;
const escapeHint = computed(() => view.value?.state.phrase(ESCAPE_HINT) ?? ESCAPE_HINT);

const KEYMAP_NAMES: Partial<Record<RcCodeMirrorKeymap, string>> = { vim: 'Vim', emacs: 'Emacs' };
const isKeymapIndicatorDismissed = ref(false);
const keymapName = computed(() => (props.keymap ? KEYMAP_NAMES[props.keymap] : undefined));
// Waits for the view, whose phrases translate the indicator's text
const showKeymapIndicator = computed(() => !!view.value && props.keymapIndicator && props.variant !== 'input' && !!keymapName.value && !isKeymapIndicatorDismissed.value);

// `$` is replaced with the keymap name, so translations can place it anywhere
function keymapPhrase(phrase: string): string {
  const state = view.value?.state;

  return state && keymapName.value ? state.phrase(phrase, state.phrase(keymapName.value)) : '';
}

const keymapIndicatorTooltip = computed(() => keymapPhrase('Key mapping: $'));
const keymapIndicatorLabel = computed(() => keymapPhrase('Hide key mapping: $'));

// The indicator is removed as it is selected, so give focus to the editor rather than losing it
function dismissKeymapIndicator(): void {
  isKeymapIndicatorDismissed.value = true;
  view.value?.focus();
}

function isEditorAttribute(name: string): boolean {
  return name.startsWith('aria-') || name.toLowerCase() === 'tabindex';
}

// CodeMirror renders the textbox inside the container, so its ARIA attributes and tab order
// belong there. Everything else still falls through to the container.
const containerAttrs = computed(() => Object.fromEntries(
  Object.entries(attrs).filter(([name]) => !isEditorAttribute(name))
));

function editorAttributes(): Record<string, string> {
  const attributes = Object.fromEntries(
    Object.entries(attrs)
      .filter(([name, value]) => isEditorAttribute(name) && value !== undefined && value !== null)
      .map(([name, value]) => [name.toLowerCase() === 'tabindex' ? 'tabindex' : name, String(value)])
  );

  if (props.readOnly && attributes.tabindex === undefined) {
    attributes.tabindex = '0';
  }

  return attributes;
}

// Compartments for hot-swappable extensions
const languageCompartment = new Compartment();
const keymapCompartment = new Compartment();
const themeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const lineWrappingCompartment = new Compartment();
const foldGutterCompartment = new Compartment();
const lintCompartment = new Compartment();
const contentAttributesCompartment = new Compartment();

function getThemeExtension(theme?: RcCodeMirrorTheme, variant?: RcCodeMirrorVariant): Extension {
  if (theme === 'rancher') {
    return variant === 'input' ? rancherInputTheme : rancherTheme;
  }

  return [];
}

function getLineNumbersExtension(show: boolean): Extension {
  return show ? cmLineNumbers() : [];
}

// The input variant has no gutters
function showLineNumbers(): boolean {
  return props.variant !== 'input' && (props.lineNumbers ?? true);
}

function foldMarkerDOM(open: boolean): HTMLElement {
  const span = document.createElement('span');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const phrase = open ? 'Fold line' : 'Unfold line';

  span.className = 'rc-cm-fold-marker';
  span.title = (view.value?.state ?? initialState)?.phrase(phrase) ?? phrase;
  icon.setAttribute('viewBox', '0 0 10 10');
  icon.setAttribute('aria-hidden', 'true');
  triangle.setAttribute('d', open ? 'M2.5 3 7.5 3 5 7.5z' : 'M3 2.5 7.5 5 3 7.5z');
  icon.appendChild(triangle);
  span.appendChild(icon);

  return span;
}

function getFoldGutterExtension(show: boolean): Extension {
  return show ? cmFoldGutter({ markerDOM: foldMarkerDOM }) : [];
}

// The input variant has no gutters. Folding itself stays enabled without the gutter, so folds
// can still be made programmatically (e.g. foldYamlPath) and from the keyboard
function showFoldGutter(): boolean {
  return props.variant !== 'input' && (props.foldGutter ?? true);
}

// The input variant has no gutters, so its problems are only underlined
function getLintExtension(source: LintSource | undefined, variant: RcCodeMirrorVariant): Extension {
  if (!source) {
    return [];
  }

  return variant === 'input' ? cmLinter(source) : [cmLinter(source), lintGutter()];
}

// The input variant always wraps, like a textarea
function wrapLines(): boolean {
  return props.variant === 'input' || (props.lineWrapping ?? false);
}

// editable only stops the content being contenteditable, readOnly stops commands (e.g. Enter
// from a keymap) changing the document, so both are needed
function getReadOnlyExtension(readOnly: boolean): Extension {
  return [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
}

function getLineWrappingExtension(wrap: boolean): Extension {
  return wrap ? EditorView.lineWrapping : [];
}

function getContentAttributesExtension(attributes: Record<string, string>): Extension {
  return EditorView.contentAttributes.of(attributes);
}

function handleFocusIn(event: FocusEvent): void {
  if (event.target === view.value?.contentDOM) {
    isEditorFocused.value = true;
  }
}

function handleFocusOut(event: FocusEvent): void {
  if (event.target === view.value?.contentDOM) {
    isEditorFocused.value = false;
  }
}

function handleEditorKeydown(event: KeyboardEvent): void {
  const editor = view.value;

  if (editor && event.code === 'Escape' && !event.shiftKey && event.target === editor.contentDOM) {
    editor.setTabFocusMode(2000);
  }
}

// Escape belongs to the editor (Vim uses it to leave Insert mode), so it must not also reach page
// handlers such as a modal closing on Escape. This runs after CodeMirror has handled the key. Escape in the
// search panel removes the panel before the event bubbles here, so check the path it was dispatched along.
function stopEditorEscape(event: KeyboardEvent): void {
  const editor = view.value?.dom;

  if (event.code === 'Escape' && editor && event.composedPath().includes(editor)) {
    event.stopPropagation();
  }
}

onMounted(() => {
  if (!container.value) {
    return;
  }

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const value = update.state.doc.toString();

      emit('update:modelValue', value);
      emit('change', value);
    }
    if (update.focusChanged) {
      if (update.view.hasFocus) {
        emit('focus', update.view);
      } else {
        emit('blur', update.view);
      }
    }
  });

  const state = EditorState.create({
    doc:        props.modelValue ?? '',
    extensions: [
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      autocompletion(),
      buildFoldExtension(props.foldOptions),
      languageCompartment.of(getLanguageExtension(props.language)),
      keymapCompartment.of(getKeymapExtension(props.keymap, props.variant)),
      themeCompartment.of(getThemeExtension(props.theme, props.variant)),
      // Gutters are shown in this order
      lineNumbersCompartment.of(getLineNumbersExtension(showLineNumbers())),
      lintCompartment.of(getLintExtension(props.linter, props.variant)),
      foldGutterCompartment.of(getFoldGutterExtension(showFoldGutter())),
      lineWrappingCompartment.of(getLineWrappingExtension(wrapLines())),
      readOnlyCompartment.of(getReadOnlyExtension(props.readOnly ?? false)),
      contentAttributesCompartment.of(getContentAttributesExtension(editorAttributes())),
      updateListener,
      ...(bottomPanels.value ? [bottomPanelsExtension(bottomPanels.value)] : []),
      ...(props.extensions ?? [])
    ]
  });

  // The fold gutter renders its initial markers before view.value is assigned.
  initialState = state;
  const editorView = new EditorView({
    state,
    parent: container.value
  });

  view.value = editorView;
  emit('ready', editorView);
});

onBeforeUnmount(() => {
  view.value?.destroy();
});

// External modelValue changes → dispatch to editor
watch(
  () => props.modelValue,
  (newVal) => {
    const v = view.value;

    if (!v) {
      return;
    }
    const current = v.state.doc.toString();

    if (newVal === current) {
      return;
    }

    v.dispatch({
      changes: {
        from:   0,
        to:     v.state.doc.length,
        insert: newVal ?? ''
      }
    });
  }
);

// Hot-swap language
watch(
  () => props.language,
  (lang) => {
    view.value?.dispatch({ effects: languageCompartment.reconfigure(getLanguageExtension(lang)) });
  }
);

// Hot-swap keymap and Tab behavior when switching between editor and input variants
watch(
  () => [props.keymap, props.variant] as const,
  ([km, variant]) => {
    view.value?.dispatch({ effects: keymapCompartment.reconfigure(getKeymapExtension(km, variant)) });
  }
);

// Hot-swap theme
watch(
  () => [props.theme, props.variant] as const,
  ([theme, variant]) => {
    view.value?.dispatch({ effects: themeCompartment.reconfigure(getThemeExtension(theme, variant)) });
  }
);

// Hot-swap readOnly
watch(
  () => props.readOnly,
  (ro) => {
    view.value?.dispatch({ effects: readOnlyCompartment.reconfigure(getReadOnlyExtension(ro ?? false)) });
  }
);

// Hot-swap lineNumbers
watch(
  () => showLineNumbers(),
  (show) => {
    view.value?.dispatch({ effects: lineNumbersCompartment.reconfigure(getLineNumbersExtension(show)) });
  }
);

// Hot-swap linter
watch(
  () => [props.linter, props.variant] as const,
  ([source, variant]) => {
    view.value?.dispatch({ effects: lintCompartment.reconfigure(getLintExtension(source, variant)) });
  }
);

// Hot-swap foldGutter
watch(
  () => showFoldGutter(),
  (show) => {
    view.value?.dispatch({ effects: foldGutterCompartment.reconfigure(getFoldGutterExtension(show)) });
  }
);

// Hot-swap lineWrapping
watch(
  () => wrapLines(),
  (wrap) => {
    view.value?.dispatch({ effects: lineWrappingCompartment.reconfigure(getLineWrappingExtension(wrap)) });
  }
);

// Hot-swap editor attributes, including the read-only tab stop
watch(
  editorAttributes,
  (attributes) => {
    view.value?.dispatch({ effects: contentAttributesCompartment.reconfigure(getContentAttributesExtension(attributes)) });
  }
);

defineExpose({ view });
</script>

<template>
  <div
    v-bind="containerAttrs"
    ref="container"
    class="rc-code-mirror"
    :class="`rc-code-mirror--${ variant }`"
    @keydown.capture="handleEditorKeydown"
    @keydown="stopEditorEscape"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <span
      v-show="isEditorFocused && variant !== 'input' && !readOnly"
      class="rc-cm-escape-hint"
      role="alert"
    >{{ escapeHint }}</span>
    <RcButton
      v-if="showKeymapIndicator"
      v-clean-tooltip="keymapIndicatorTooltip"
      type="button"
      variant="ghost"
      class="rc-cm-keymap-indicator"
      data-testid="code-mirror-keymap"
      :aria-label="keymapIndicatorLabel"
      @click="dismissKeymapIndicator"
    >
      <i
        class="icon icon-keyboard rc-cm-keymap-icon"
        aria-hidden="true"
      />
      <i
        class="icon icon-close icon-sm rc-cm-keymap-close"
        aria-hidden="true"
      />
    </RcButton>
    <!-- CodeMirror gives the panels' container the editor's theme classes, whose root styles would unstick it -->
    <div class="rc-cm-bottom-panels">
      <div ref="bottomPanels" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rc-code-mirror {
  --rc-cm-bg: #FFFFFF;
  --rc-cm-selection: #E0E0E0;
  --rc-cm-key: #1A4FA8;
  --rc-cm-string: #8A4B10;
  --rc-cm-keyword: #9A2B94;
  --rc-cm-comment: #5B616D;
  --rc-cm-text: #16181D;
  --rc-cm-gutter: #5B626C;
  --rc-cm-fold-hover: #E8ECF2;
  --rc-cm-active-line: rgba(0, 0, 0, 0.04);
  --rc-cm-search-match: rgba(255, 213, 0, 0.4);
  --rc-cm-search-match-selected: rgba(255, 140, 0, 0.5);
  --rc-cm-color-scheme: light;

  // A column, so the editor shrinks to make room for the bottom panels strip in a fixed height
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  position: relative;

  .rc-cm-escape-hint {
    position: absolute;
    right: 8px;
    bottom: 4px;
    z-index: 2;
    padding: 2px 4px;
    color: var(--rc-cm-text);
    background-color: var(--rc-cm-bg);
    font-size: 12px;
    pointer-events: none;
  }

  .rc-cm-keymap-indicator {
    $animation-time: 0.1s;

    --rc-button-padding: 0;

    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 2;
    width: 48px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    color: var(--darker);
    background-color: var(--subtle-overlay-bg);
    cursor: pointer;

    .rc-cm-keymap-icon {
      font-size: 24px;
      opacity: 0.8;
      transition: margin-right $animation-time ease-in-out;
    }

    .rc-cm-keymap-close {
      width: 0;
      overflow: hidden;
      color: var(--primary);
      opacity: 0;
    }

    &:hover, &:focus-visible {
      border-color: var(--primary);

      .rc-cm-keymap-icon {
        opacity: 0.6;
        margin-right: 4px;
      }

      .rc-cm-keymap-close {
        width: auto;
        opacity: 1;
        transition: opacity $animation-time ease-in-out $animation-time; // Only animate when being shown
      }
    }

    &:focus-visible {
      outline: 2px solid var(--primary-keyboard-focus);
      outline-offset: 1px;
    }
  }

  :deep(.cm-editor) {
    height: 100%;
    min-height: 0;
  }

  // Holds CodeMirror's bottom panels, such as Vim's command line, above the editor (see extensions/panels.ts)
  .rc-cm-bottom-panels {
    position: sticky;
    top: 0;
    // Above the editor's panels and focus ring
    z-index: 302;

    // As tall as the Dashboard's side navigation toolbar, the "Jump to..." search, including its border, so their
    // bottom borders line up when the strip sticks below the header
    :deep(.cm-panels) {
      position: static;
      box-sizing: border-box;
      height: 40px;
      color: var(--rc-cm-text);
      background-color: var(--rc-cm-bg);
      border: none;
      border-bottom: 1px solid var(--border, #DCDEE7);
    }

    :deep(.cm-vim-panel) {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      height: 100%;
      min-height: 0;
      padding: 0 8px;
      font-size: 14px;

      // Vim sets the prompt's font and its hint's color inline
      span {
        font-family: $mono-font !important;
        align-items: center;
      }

      span + span {
        color: var(--rc-cm-comment) !important;
        font-family: inherit !important;
      }

      // The Dashboard's global styles make text inputs full width blocks with a border, which put the field on
      // its own line below the prompt
      input {
        display: inline-block;
        width: auto;
        min-width: 0;
        height: auto;
        padding: 0 0 0 2px;
        border: none;
        border-radius: 0;
        outline: none;
        color: inherit;
        caret-color: var(--rc-cm-key);
        background-color: transparent;
        font: inherit;
      }
    }
  }

  :deep(.cm-editor.cm-focused) {
    outline: none;
  }

  &.rc-code-mirror--editor :deep(.cm-scroller),
  &.rc-code-mirror--editor :deep(.cm-tooltip-autocomplete > ul) {
    font-family: $mono-font;
  }

  &.rc-code-mirror--editor :deep(.cm-foldGutter) {
    width: 22px;

    .cm-gutterElement {
      width: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;

      &:has(.rc-cm-fold-marker) {
        cursor: pointer;
      }

      &:has(.rc-cm-fold-marker):hover {
        background-color: var(--rc-cm-fold-hover);
      }
    }

    .rc-cm-fold-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 0;
    }

    svg {
      display: block;
      width: 10px;
      height: 10px;
      fill: currentColor;
    }
  }

  &.rc-code-mirror--editor :deep(.cm-editor.cm-focused) {
    outline: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid var(--primary-keyboard-focus);
      pointer-events: none;
      // Above CodeMirror's panels (z-index 300), so the search panel does not cover the ring
      z-index: 301;
    }
  }

  &.rc-code-mirror--input :deep(.cm-editor) {
    min-height: 40px;
    box-sizing: border-box;
    padding: 10px;
    background-color: var(--input-bg);
    border-radius: var(--border-radius);
    border: solid var(--border-width) var(--input-border);
    color: var(--input-text);

    &:hover {
      border-color: var(--input-hover-border);
    }

    &.cm-focused {
      border-color: var(--primary-border);
    }

    .cm-scroller {
      font-family: $body-font;
    }

    .cm-content, .cm-line {
      padding: 0;
    }

    // Mark line breaks visually without adding the marker to the spoken value
    .cm-line:not(:last-child)::after {
      content: '↵' / '';
      margin-left: 2px;
      color: var(--muted);
      pointer-events: none;
    }

    .cm-selectionBackground, &.cm-focused .cm-selectionBackground {
      background-color: var(--primary);
    }
  }
}

.rc-code-mirror:is(.theme-dark *) {
  --rc-cm-bg: #171C22;
  --rc-cm-selection: #303030;
  --rc-cm-key: #79B8FF;
  --rc-cm-string: #E0A458;
  --rc-cm-keyword: #E48AD8;
  --rc-cm-comment: #9AA1AC;
  --rc-cm-text: #E6E9EF;
  --rc-cm-gutter: #9AA1AC;
  --rc-cm-fold-hover: #3C4655;
  --rc-cm-active-line: rgba(255, 255, 255, 0.04);
  --rc-cm-search-match: rgba(255, 213, 0, 0.25);
  --rc-cm-search-match-selected: rgba(255, 140, 0, 0.45);
  --rc-cm-color-scheme: dark;
}
</style>
