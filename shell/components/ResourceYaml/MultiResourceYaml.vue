<script setup lang="ts">
import {
  computed, reactive, ref, watch, ComputedRef
} from 'vue';
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

// parent layout classes (e.g. cru-resource's .resource-container) would override the root grid
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  value: EditableResource,

  /** edited alongside `value`, each carrying its own save hooks, banner and groupKey */
  relatedResources: EditableRelatedResource[],
}>();

const store = useStore();
const i18n = useI18n(store);

// handed to the related resources' compute functions and save hooks
// tracks which resource is currently shown in the yaml editor, as well as yaml editor state for each resource
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
// computed props are initialized here for better extension compatibility (ext only need to define plain functions)
const bannerRefs = computed<ComputedRef<EditableRelatedResourceBanner | null>[]>(() => props.relatedResources.map((entry) => computed(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(entry)) || null;
  } catch (e) {
    // TODO nb localize? Growl?
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

const primaryId = computed(() => keyForResource(props.value) || 'primary');

// initial resource state, used for diff view
const initialYamlFor = (resource: EditableResource): string => {
  if (!resource) {
    return '';
  }

  return saferDump(resource);
};

// map of initial yaml values, used for diff view and to visualize which resources changed in the resource graph
const initialYamlById = computed<{ [nodeId: string]: string }>(() => {
  const out: { [nodeId: string]: string } = { [primaryId.value]: initialYamlFor(props.value) };

  props.relatedResources.forEach((entry, i) => {
    out[nodeIdFor(entry, i)] = initialYamlFor(entry.resource);
  });

  return out;
});

// ids of resources whose editor content differs from the server state
// a resource never opened in the editor has no entry in `editorState.yaml`, so is not modified
const modifiedIds = computed(() => new Set(
  Object.keys(editorState.yaml).filter((id) => id in initialYamlById.value && editorState.yaml[id] !== initialYamlById.value[id])
));

// primary resource first, then each related resource under its translated `groupKey`
// `parentId` nests a resource's group below the resource that contributed it, defaulting to the
// primary resource so that it is the only root and every related resource descends from it
// TODO nb wtf is this comment
const graphNodes = computed<ResourceGraphNode[]>(() => {
  const primary: ResourceGraphNode = {
    id:       primaryId.value,
    label:    resourceLabel(props.value),
    group:    props.value?.typeDisplay || props.value?.type || undefined,
    modified: modifiedIds.value.has(primaryId.value),
  };

  const related: ResourceGraphNode[] = props.relatedResources.map((entry, i) => {
    const id = nodeIdFor(entry, i);

    return {
      id,
      parentId: entry.parentId || primaryId.value,
      label:    resourceLabel(entry.resource),
      group:    entry.group || (entry.groupKey ? i18n.t(entry.groupKey) : undefined),
      modified: modifiedIds.value.has(id),
    };
  });

  return [primary, ...related];
});

// -1 when the primary resource is selected
// TODO nb why negative 1
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

// what is currently displayed in the yaml editor
const currentYaml = computed({
  get(): string {
    const id = editorState.selected;

    if (!id) {
      return '';
    }

    if (!(id in editorState.yaml)) {
      editorState.yaml[id] = initialYamlById.value[id] ?? initialYamlFor(selectedResource.value);
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

const selectedModified = computed(() => !!editorState.selected && modifiedIds.value.has(editorState.selected));

const showDiff = ref(false);

// a diff with no changes is empty, so leave diff view once there is nothing to compare
// switching resource also leaves it, so the next resource opens ready to edit
watch([selectedModified, () => editorState.selected], ([modified], [, prevSelected]) => {
  if (!modified || editorState.selected !== prevSelected) {
    showDiff.value = false;
  }
});

// the save path and the parent both read the editor's unsaved state
// TODO nb wtf this?
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
      <Transition
        name="yaml-fade"
        mode="out-in"
      >
        <!-- YamlEditor reads `value` into the diff only in data(), so it must remount when the mode changes -->
        <div
          v-if="editorState.selected"
          :key="`${editorState.selected}-${showDiff}`"
          class="multi-yaml-editor"
          :class="{ 'multi-yaml-editor--diff': showDiff }"
        >
          <Banner
            v-if="selectedBanner"
            :color="selectedBanner.color || 'info'"
            :label="selectedBanner.label"
            :label-key="selectedBanner.labelKey"
            :icon="selectedBanner.icon"
          />
          <YamlEditor
            v-model:value="currentYaml"
            :initial-yaml-values="initialYamlById[editorState.selected] ?? initialYamlFor(selectedResource)"
            :editor-mode="showDiff ? EDITOR_MODES.DIFF_CODE : EDITOR_MODES.EDIT_CODE"
            :diff-context="Number.MAX_SAFE_INTEGER"
          />
        </div>
      </Transition>
    </div>
    <div class="multi-yaml-footer">
      <RcButton
        variant="secondary"
        :disabled="!selectedModified"
        :aria-pressed="showDiff"
        data-testid="multi-yaml-diff-toggle"
        @click="showDiff = !showDiff"
      >
        {{ i18n.t(showDiff ? 'resourceYaml.buttons.hideDiff' : 'resourceYaml.buttons.diff') }}
      </RcButton>
      <RcButton variant="secondary">
        Cancel
      </RcButton>
      <RcButton variant="primary">
        Save this resource
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multi-yaml-container {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: 1fr auto;
  gap: 16px;

  // fill vertical space below the masthead - graph and editor scroll independently
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
  background-color: var(--yaml-editor-bg);
}

.multi-yaml-editor {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  & :deep(.banner) {
    flex-shrink: 0;
    margin: 0;
  }

  & :deep(.yaml-editor) {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
  }

  // FileDiff scrolls itself: it sets its own height in fit() and has overflow: auto
  &--diff :deep(.yaml-editor) {
    overflow: hidden;
  }
}

// out-in runs leave then enter, so the total switch time is the sum of both durations
.yaml-fade-leave-active {
  transition: opacity 0.1s;
}

.yaml-fade-leave-to {
  opacity: 0;
}

// mask is used to create a top-down fade-in effect
.yaml-fade-enter-active {
  mask-image: linear-gradient(to bottom, #000 33.3%, transparent 66.6%);
  mask-size: 100% 300%;
  mask-repeat: no-repeat;
  mask-position: 0 0;
  transition: mask-position 0.3s ease-out;
}

.yaml-fade-enter-from {
  mask-position: 0 100%;
}


.multi-yaml-footer {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  grid-row: 2;
  grid-column: 1 / -1;
  padding: 11px var(--gap) 11px var(--gap);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
