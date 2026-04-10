<script setup lang="ts">
import {
  ref, shallowRef, onMounted, onBeforeUnmount, watch
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
  bracketMatching
} from '@codemirror/language';
import { closeBrackets, autocompletion } from '@codemirror/autocomplete';
import { search } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { getLanguageExtension } from '../extensions/syntax';
import { getKeymapExtension } from '../extensions/keymaps';
import { buildFoldExtension } from '../extensions/fold';
import type { FoldOptions } from '../extensions/fold';

export interface Props {
  modelValue?: string;
  language?: 'yaml' | 'json';
  keymap?: 'default' | 'vim' | 'emacs';
  theme?: 'one-dark' | 'none';
  readOnly?: boolean;
  lineNumbers?: boolean;
  foldGutter?: boolean;
  lineWrapping?: boolean;
  extensions?: Extension[];
  foldOptions?: FoldOptions;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue:   '',
  language:     undefined,
  keymap:       undefined,
  theme:        'none',
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

const container = ref<HTMLDivElement>();
const view = shallowRef<EditorView>();

// Compartments for hot-swappable extensions
const languageCompartment = new Compartment();
const keymapCompartment = new Compartment();
const themeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const lineWrappingCompartment = new Compartment();

function getThemeExtension(theme?: 'one-dark' | 'none'): Extension {
  if (theme === 'one-dark') {
    return oneDark;
  }

  return [];
}

function getLineNumbersExtension(show: boolean): Extension {
  return show ? cmLineNumbers() : [];
}

function getLineWrappingExtension(wrap: boolean): Extension {
  return wrap ? EditorView.lineWrapping : [];
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

  const foldExt = props.foldGutter ? buildFoldExtension(props.foldOptions) : [];

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
      foldExt,
      languageCompartment.of(getLanguageExtension(props.language)),
      keymapCompartment.of(getKeymapExtension(props.keymap)),
      themeCompartment.of(getThemeExtension(props.theme)),
      lineNumbersCompartment.of(getLineNumbersExtension(props.lineNumbers ?? true)),
      lineWrappingCompartment.of(getLineWrappingExtension(props.lineWrapping ?? false)),
      readOnlyCompartment.of(EditorView.editable.of(!(props.readOnly ?? false))),
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
  () => props.theme,
  (theme) => {
    view.value?.dispatch({ effects: themeCompartment.reconfigure(getThemeExtension(theme)) });
  }
);

// Hot-swap readOnly
watch(
  () => props.readOnly,
  (ro) => {
    view.value?.dispatch({ effects: readOnlyCompartment.reconfigure(EditorView.editable.of(!ro)) });
  }
);

// Hot-swap lineNumbers
watch(
  () => props.lineNumbers,
  (show) => {
    view.value?.dispatch({ effects: lineNumbersCompartment.reconfigure(getLineNumbersExtension(show ?? true)) });
  }
);

// Hot-swap lineWrapping
watch(
  () => props.lineWrapping,
  (wrap) => {
    view.value?.dispatch({ effects: lineWrappingCompartment.reconfigure(getLineWrappingExtension(wrap ?? false)) });
  }
);

defineExpose({ view });
</script>

<template>
  <div
    ref="container"
    class="rancher-codemirror"
  />
</template>

<style>
.rancher-codemirror {
  display: contents;
}

.rancher-codemirror .cm-editor {
  height: 100%;
}

.rancher-codemirror .cm-editor.cm-focused {
  outline: none;
}
</style>
