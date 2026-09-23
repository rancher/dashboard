<script setup lang="ts">
import { computed, reactive, watch, ComputedRef } from 'vue';
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor.vue';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import { ResourceGraphNode } from '@shell/components/ResourceYaml/types';
import { keyForResource } from '@shell/utils/resource-key';
import { saferDump } from '@shell/utils/create-yaml';
import {
  EditableRelatedResource,
  EditableRelatedResourceBanner,
  EditableRelatedResourceContext,
  EditableRelatedResourcesEditorState,
  EditableResource,
} from '@shell/core/types';

const props = defineProps<{
  value: EditableResource,

  /** edited alongside `value`, each carrying its own save hooks, banner and groupKey */
  relatedResources: EditableRelatedResource[],
}>();

const store = useStore();
const i18n = useI18n(store);

// handed to the related resources' compute functions and save hooks
const editorState = reactive<EditableRelatedResourcesEditorState>({
  yaml:     {},
  selected: keyForResource(props.value) || null,
});

watch(() => props.value, (neu) => {
  editorState.selected = keyForResource(neu) || null;
});

const contextFor = (entry: EditableRelatedResource): EditableRelatedResourceContext => ({
  resource:         entry.resource,
  relatedResources: props.relatedResources,
  primaryResource:  props.value,
  editorState,
});

// one `computed` per related resource, in the same order as `relatedResources`
// per-banner `computed` limits re-evaluation to the state each banner actually read
// created here so a resource model or extension only has to provide a plain function
const bannerRefs = computed<ComputedRef<EditableRelatedResourceBanner | null>[]>(() => props.relatedResources.map((entry) => computed(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(entry)) || null;
  } catch (e) {
    console.warn('Failed to resolve banner for editable related resource', entry.resource?.id, e); // eslint-disable-line no-console

    return null;
  }
})));

const bannerFor = (index: number): EditableRelatedResourceBanner | null => bannerRefs.value[index]?.value || null;

const resourceLabel = (resource: EditableResource): string => resource?.nameDisplay ||
  resource?.metadata?.name ||
  resource?.id ||
  '';

// `nodeId` is set when the tree was flattened; the fallbacks let a plain list work unflattened
const nodeIdFor = (entry: EditableRelatedResource, i: number): string => entry.nodeId || keyForResource(entry.resource) || String(i);

// primary resource first, then each related resource under its translated `groupKey`
// `parentId` nests a resource's group below the resource that contributed it, defaulting to the
// primary resource so that it is the only root and every related resource descends from it
const graphNodes = computed<ResourceGraphNode[]>(() => {
  const primaryId = keyForResource(props.value) || 'primary';

  const primary: ResourceGraphNode = {
    id:    primaryId,
    label: resourceLabel(props.value),
    group: props.value?.typeDisplay || props.value?.type || undefined,
  };

  const related: ResourceGraphNode[] = props.relatedResources.map((entry, i) => ({
    id:       nodeIdFor(entry, i),
    parentId: entry.parentId || primaryId,
    label:    resourceLabel(entry.resource),
    group:    entry.group || (entry.groupKey ? i18n.t(entry.groupKey) : undefined),
  }));

  return [primary, ...related];
});

// -1 when the primary resource is selected
const selectedRelatedIndex = computed(() => props.relatedResources.findIndex(
  (entry, i) => nodeIdFor(entry, i) === editorState.selected
));

const selectedBanner = computed(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? bannerFor(idx) : null;
});

const selectedResource = computed<EditableResource>(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? props.relatedResources[idx].resource : props.value;
});

// left-hand side of the diff view: server state, not what the user has typed
const initialYamlFor = (resource: EditableResource): string => {
  if (!resource) {
    return '';
  }

  return saferDump(resource);
};

// backed by `editorState.yaml` so switching away and back preserves unsaved edits
const currentYaml = computed({
  get(): string {
    const id = editorState.selected;

    if (!id) {
      return '';
    }

    if (!(id in editorState.yaml)) {
      editorState.yaml[id] = initialYamlFor(selectedResource.value);
    }

    return editorState.yaml[id];
  },

  set(value: string) {
    const id = editorState.selected;

    if (id) {
      editorState.yaml[id] = value;
    }
  },
});

// the save path and the parent both read the editor's unsaved state
defineExpose({ editorState });
</script>

<template>
  <div class="multi-yaml-container">
    <ResourceGraph
      class="multi-yaml-resource-graph"
      :nodes="graphNodes"
      :selected="editorState.selected"
      @select="editorState.selected = $event"
    />
    <div class="multi-yaml-editor-container">
      <Banner
        v-if="selectedBanner"
        :color="selectedBanner.color || 'info'"
        :label="selectedBanner.label"
        :label-key="selectedBanner.labelKey"
        :icon="selectedBanner.icon"
      />
      <YamlEditor
        v-if="editorState.selected"
        :key="editorState.selected"
        v-model:value="currentYaml"
        :initial-yaml-values="initialYamlFor(selectedResource)"
        :editor-mode="EDITOR_MODES.EDIT_CODE"
      />
    </div>
    <div class="multi-yaml-footer">
      <RcButton variant="primary">
        Save
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multi-yaml-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 1fr auto;
  gap: 16px;

  // parent is `.outlet`, a viewport-height flex column
  // flex-basis 0 plus `min-height: 0` fills the remaining vertical space exactly
  // graph and yaml editor scroll independently, so nothing scrolls here
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.multi-yaml-resource-graph {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  grid-row: 1 / span 1;
  overflow: hidden;
}

.multi-yaml-editor-container {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  grid-row: 1 / span 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  & :deep(.banner) {
    flex-shrink: 0;
    margin: 0;
  }

  & :deep(.yaml-editor) {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
  }
}


.multi-yaml-footer {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  grid-row: 2;
  grid-column: 1 / -1;
  padding: 11px var(--gap) 11px var(--gap);
  display: flex;
  justify-content: flex-end;
}
</style>
