<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import TemplatePanel from './TemplatePanel.vue';
import HomeConfigChat from './HomeConfigChat.vue';
import {
  templateByName, savedHomeTemplates, saveHomeTemplate, saveTemplateJson, fetchTemplatingConfigMaps
} from '../templating/template-engine';
import type { TemplateWidget } from '../templating/types';

// Escaped closing tags so this SFC still parses.
const STARTER_CODE = `<script>
export default {};
<\/script>
<template>
  <div style="padding: 24px">
    <h1>New template</h1>
  </div>
<\/template>`;
const STARTER_JSON = JSON.stringify([{ type: 'banner', title: 'New block' }], null, 2);
const PREVIEW_DEBOUNCE = 300;

const props = defineProps<{
  /** Name of the template ConfigMap being edited. */
  name: string;
  /** 'code' | 'json' marks a brand new template of that kind: start blank, write nothing until Save. */
  newKind?: string | null;
  newDisplayName?: string;
}>();

const emit = defineEmits<{(e: 'close'): void; (e: 'saved', name: string): void;}>();

const store = useStore();

const created = ref(!props.newKind);
const isJson = ref(false);
const draft = ref('');
const debouncedDraft = ref('');
const savedDraft = ref('');
const saving = ref(false);
const saveError = ref('');
const status = ref('');
const editorWidth = ref(42);
const split = ref<HTMLElement | null>(null);

const asJson = (widgets: TemplateWidget[]) => JSON.stringify(widgets || [], null, 2);

if (props.newKind) {
  isJson.value = props.newKind === 'json';
  savedDraft.value = isJson.value ? STARTER_JSON : STARTER_CODE;
} else {
  const resolved = templateByName(store.getters, props.name);

  isJson.value = resolved.kind === 'json';
  savedDraft.value = isJson.value ? asJson(resolved.widgets) : resolved.source;
}
draft.value = savedDraft.value;
debouncedDraft.value = draft.value;

const displayName = computed(() => {
  if (!created.value) {
    return props.newDisplayName || props.name;
  }

  const t = savedHomeTemplates(store.getters).find((c: { metadata?: { name?: string } }) => c.metadata?.name === props.name);

  return t?.spec?.displayName || props.name;
});

const parseWidgets = (text: string): TemplateWidget[] => {
  const parsed = JSON.parse(text || '[]');

  return Array.isArray(parsed) ? parsed : (parsed.widgets || []);
};

/** Empty while the JSON is invalid, so a half-typed edit does not blank the preview with an error. */
const previewWidgets = computed(() => {
  if (!isJson.value) {
    return [];
  }

  try {
    return parseWidgets(debouncedDraft.value);
  } catch {
    return [];
  }
});

const jsonError = computed(() => {
  if (!isJson.value || !draft.value.trim()) {
    return '';
  }

  try {
    parseWidgets(draft.value);

    return '';
  } catch (e) {
    return (e as Error)?.message || 'Invalid JSON';
  }
});

/** A never-saved template is always dirty, so Save is enabled to create it. */
const dirty = computed(() => !created.value || draft.value !== savedDraft.value);

let debounceTimer: ReturnType<typeof setTimeout>;

watch(draft, (val) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedDraft.value = val;
  }, PREVIEW_DEBOUNCE);
});

onBeforeUnmount(() => clearTimeout(debounceTimer));

async function save() {
  saving.value = true;
  saveError.value = '';
  status.value = '';

  try {
    if (isJson.value) {
      await saveTemplateJson(store, {
        name: props.name, widgets: parseWidgets(draft.value), displayName: displayName.value
      });
    } else {
      await saveHomeTemplate(store, {
        name: props.name, source: draft.value, displayName: displayName.value
      });
    }

    savedDraft.value = draft.value;
    created.value = true;
    status.value = 'Saved.';
    // Refresh so a newly-created template appears in the Add-template picker and the lists.
    await fetchTemplatingConfigMaps(store).catch(() => {});
    emit('saved', props.name);
  } catch (e) {
    saveError.value = (e as Error)?.message || String(e);
  } finally {
    saving.value = false;
  }
}

/** The AI agent wrote the ConfigMap — pull its content back into the editor. */
async function onAgentApplied() {
  await fetchTemplatingConfigMaps(store);
  const resolved = templateByName(store.getters, props.name);
  const next = isJson.value ? asJson(resolved.widgets) : resolved.source;

  if (next) {
    draft.value = next;
    debouncedDraft.value = next;
    savedDraft.value = next;
    created.value = true;
    emit('saved', props.name);
  }
}

/** Window-level listeners so the drag never sticks when the pointer leaves the divider. */
function startResize(e: PointerEvent) {
  e.preventDefault();
  const total = split.value?.getBoundingClientRect().width || 1;
  const startX = e.clientX;
  const startWidth = editorWidth.value;

  const onMove = (ev: PointerEvent) => {
    editorWidth.value = Math.max(20, Math.min(75, startWidth + ((ev.clientX - startX) / total) * 100));
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('blur', onUp);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('blur', onUp);
}
</script>

<template>
  <div class="tpl-editor">
    <div class="tpl-editor__bar">
      <RcButton
        variant="secondary"
        size="small"
        @click="emit('close')"
      >
        <i class="icon icon-chevron-left" /> Back
      </RcButton>
      <span class="tpl-editor__title">
        {{ created ? 'Editing' : 'New' }} {{ isJson ? 'JSON template' : 'template' }} <b>{{ displayName }}</b>
      </span>
      <RcButton
        variant="primary"
        size="small"
        :disabled="saving || !dirty || !!jsonError"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </RcButton>
      <span
        v-if="jsonError"
        class="text-error ml-10"
      >Invalid JSON: {{ jsonError }}</span>
      <span
        v-else-if="dirty && !saving"
        class="tpl-editor__dirty"
      >• Unsaved</span>
      <span
        v-if="status && !dirty"
        class="text-success ml-10"
      >{{ status }}</span>
      <span
        v-if="saveError"
        class="text-error ml-10"
      >{{ saveError }}</span>
    </div>

    <div
      ref="split"
      class="tpl-editor__split"
    >
      <div
        class="tpl-editor__pane"
        :style="{ width: `${ editorWidth }%` }"
      >
        <textarea
          v-model="draft"
          class="tpl-editor__code"
          spellcheck="false"
          :placeholder="isJson ? '[ { &quot;type&quot;: &quot;banner&quot;, &quot;title&quot;: &quot;Welcome&quot; } ]' : ''"
        />
        <!-- The Home JSON Builder for declarative widgets, the Home Editor for an SFC. -->
        <div class="tpl-editor__chat">
          <HomeConfigChat
            v-if="isJson"
            :config-map-name="name"
            agent="template-home-json-builder"
            persona-label="Home JSON Builder"
            @applied="onAgentApplied"
          />
          <HomeConfigChat
            v-else
            :config-map-name="name"
            @applied="onAgentApplied"
          />
        </div>
      </div>
      <div
        class="tpl-editor__resizer"
        title="Drag to resize"
        @pointerdown="startResize"
      />
      <div class="tpl-editor__preview">
        <TemplatePanel
          v-if="isJson"
          :key="debouncedDraft.length"
          :widgets="previewWidgets"
        />
        <TemplatePanel
          v-else-if="debouncedDraft"
          :key="debouncedDraft.length"
          :source="debouncedDraft"
        />
        <div
          v-else
          class="text-muted p-20"
        >
          Nothing to preview.
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tpl-editor {
  display:        flex;
  flex-direction: column;
  height:         calc(100vh - var(--header-height, 54px));
  overflow:       hidden;

  &__bar {
    align-items:   center;
    background:    var(--header-bg, var(--box-bg));
    border-bottom: 1px solid var(--border);
    display:       flex;
    gap:           8px;
    padding:       8px 16px;
    flex:          0 0 auto;
  }

  &__title {
    color: var(--muted);
  }

  &__dirty {
    color:     var(--warning);
    font-size: 12px;
  }

  &__split {
    display:    flex;
    flex:       1 1 auto;
    min-height: 0;
    padding:    12px;
    overflow:   hidden;
  }

  &__pane {
    display:        flex;
    flex-direction: column;
    flex:           0 0 auto;
    min-width:      280px;
    border:         1px solid var(--border);
    border-radius:  var(--border-radius);
    overflow:       hidden;
  }

  &__resizer {
    flex:          0 0 8px;
    margin:        0 2px;
    cursor:        col-resize;
    border-radius: 4px;
    background:    var(--border);
    user-select:   none;
    touch-action:  none;

    &:hover {
      background: var(--primary);
    }
  }

  &__code {
    flex:        1 1 auto;
    min-height:  180px;
    border:      none;
    padding:     10px;
    font-family: monospace;
    font-size:   12px;
    resize:      none;
    background:  var(--body-bg);
    color:       var(--body-text);
  }

  &__chat {
    height:     45%;
    min-height: 220px;
    border-top: 1px solid var(--border);
    overflow:   hidden;
  }

  &__preview {
    flex:          1 1 auto;
    min-width:     0;
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    overflow:      auto;
    padding:       12px;
  }
}
</style>
