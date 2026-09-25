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
 * ARIA attributes (e.g. `aria-label`, `aria-labelledby`) are forwarded to the
 * editor's textbox, so give every instance an accessible name with one of them.
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
import { search } from '@codemirror/search';
import { getLanguageExtension } from './extensions/syntax';
import { getKeymapExtension } from './extensions/keymaps';
import { buildFoldExtension } from './extensions/fold';
import { rancherInputTheme, rancherTheme } from './extensions/theme';
import type { RcCodeMirrorProps, RcCodeMirrorTheme, RcCodeMirrorVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RcCodeMirrorProps>(), {
  modelValue:   '',
  language:     undefined,
  keymap:       undefined,
  theme:        'rancher',
  variant:      'editor',
  readOnly:     false,
  lineNumbers:  true,
  foldGutter:   true,
  lineWrapping: false,
  extensions:   undefined,
  foldOptions:  undefined
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
const view = shallowRef<EditorView>();

function isAriaAttribute(name: string): boolean {
  return name.startsWith('aria-');
}

// CodeMirror renders the focusable textbox inside the container, so ARIA attributes go on
// that rather than the container. Everything else still falls through to the container
const containerAttrs = computed(() => Object.fromEntries(
  Object.entries(attrs).filter(([name]) => !isAriaAttribute(name))
));

function ariaAttributes(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([name, value]) => isAriaAttribute(name) && value !== undefined && value !== null)
      .map(([name, value]) => [name, String(value)])
  );
}

// Compartments for hot-swappable extensions
const languageCompartment = new Compartment();
const keymapCompartment = new Compartment();
const themeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const lineWrappingCompartment = new Compartment();
const foldGutterCompartment = new Compartment();
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

function getFoldGutterExtension(show: boolean): Extension {
  return show ? cmFoldGutter() : [];
}

// The input variant has no gutters. Folding itself stays enabled without the gutter, so folds
// can still be made programmatically (e.g. foldYamlPath) and from the keyboard
function showFoldGutter(): boolean {
  return props.variant !== 'input' && (props.foldGutter ?? true);
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
      search(),
      buildFoldExtension(props.foldOptions),
      foldGutterCompartment.of(getFoldGutterExtension(showFoldGutter())),
      languageCompartment.of(getLanguageExtension(props.language)),
      keymapCompartment.of(getKeymapExtension(props.keymap)),
      themeCompartment.of(getThemeExtension(props.theme, props.variant)),
      lineNumbersCompartment.of(getLineNumbersExtension(showLineNumbers())),
      lineWrappingCompartment.of(getLineWrappingExtension(wrapLines())),
      readOnlyCompartment.of(getReadOnlyExtension(props.readOnly ?? false)),
      contentAttributesCompartment.of(getContentAttributesExtension(ariaAttributes())),
      updateListener,
      ...(props.extensions ?? [])
    ]
  });

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

// Hot-swap keymap
watch(
  () => props.keymap,
  (km) => {
    view.value?.dispatch({ effects: keymapCompartment.reconfigure(getKeymapExtension(km)) });
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

// Hot-swap ARIA attributes
watch(
  ariaAttributes,
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
  />
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

  display: contents;

  :deep(.cm-editor) {
    height: 100%;
  }

  :deep(.cm-editor.cm-focused) {
    outline: none;
  }

  &.rc-code-mirror--editor :deep(.cm-editor.cm-focused) {
    outline: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid var(--primary-keyboard-focus);
      pointer-events: none;
      z-index: 1;
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
}
</style>
