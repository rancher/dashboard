<script setup lang="ts">
import { computed, reactive, watch, ComputedRef } from 'vue';
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import { useI18n } from '@shell/composables/useI18n';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import { ResourceGraphNode } from '@shell/components/ResourceYaml/types';
import {
  EditableRelatedResource,
  EditableRelatedResourceBanner,
  EditableRelatedResourceContext,
  EditableRelatedResourcesEditorState,
  EditableResource,
} from '@shell/core/types';

const props = defineProps<{
  /** The resource that all of the related resources relate to */
  value: EditableResource,

  /**
   * The resources that can be edited alongside `value`, each with the configuration for it
   * (`beforeSaveHook` / `afterSaveHook` / `save` / `banner` / `groupKey`)
   */
  relatedResources: EditableRelatedResource[],
}>();

const store = useStore();
const i18n = useI18n(store);

/**
 * The reactive state of this editor, handed to the related resources' compute functions and save
 * hooks. `selected` is initialised to the primary resource's id and reset whenever `value` changes
 */
const editorState = reactive<EditableRelatedResourcesEditorState>({
  yaml:     {},
  selected: props.value?.id || null,
});

watch(() => props.value, (neu) => {
  editorState.selected = neu?.id || null;
});

/** The context given to a related resource's compute functions and save hooks */
const contextFor = (entry: EditableRelatedResource): EditableRelatedResourceContext => ({
  resource:         entry.resource,
  relatedResources: props.relatedResources,
  primaryResource:  props.value,
  editorState,
});

/**
 * A `computed` per related resource resolving its banner, in the same order as `relatedResources`
 *
 * Each banner gets its own `computed` so that it is only re-evaluated when something it read
 * changes, rather than whenever any part of the editor state does. They are created here, with the
 * shell's `computed`, so that a resource model or extension only ever has to provide a plain
 * function
 */
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

/** The resolved banner for the related resource at this position, if it has one */
const bannerFor = (index: number): EditableRelatedResourceBanner | null => bannerRefs.value[index]?.value || null;

/** The display label for a resource — prefers nameDisplay, falls back to metadata.name, then id */
const resourceLabel = (resource: EditableResource): string => resource?.nameDisplay ||
  resource?.metadata?.name ||
  resource?.id ||
  '';

/**
 * The nodes passed to `ResourceGraph`, starting with the primary resource (no group) followed by
 * each related resource under its translated `groupKey` heading
 */
const graphNodes = computed<ResourceGraphNode[]>(() => {
  const primary: ResourceGraphNode = {
    id:    props.value?.id || 'primary',
    label: resourceLabel(props.value),
  };

  const related: ResourceGraphNode[] = props.relatedResources.map((entry, i) => ({
    id:    entry.resource?.id || String(i),
    label: resourceLabel(entry.resource),
    group: entry.groupKey ? i18n.t(entry.groupKey) : undefined,
  }));

  return [primary, ...related];
});

/**
 * The index of the selected resource in `relatedResources`, or -1 if the primary is selected
 *
 * Used to look up the banner for the resource currently shown in the editor
 */
const selectedRelatedIndex = computed(() => props.relatedResources.findIndex(
  (entry, i) => (entry.resource?.id || String(i)) === editorState.selected
));

/** The banner for the currently selected resource, if it is a related resource with one */
const selectedBanner = computed(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? bannerFor(idx) : null;
});

// The save path, and the parent, need to see what the user has done in the editor
defineExpose({ editorState });
</script>

<template>
  <div class="multi-resource-yaml">
    <ResourceGraph
      class="multi-resource-yaml__graph"
      :nodes="graphNodes"
      :selected="editorState.selected"
      @select="editorState.selected = $event"
    />
    <div class="multi-resource-yaml__editor">
      <Banner
        v-if="selectedBanner"
        :color="selectedBanner.color || 'info'"
        :label="selectedBanner.label"
        :label-key="selectedBanner.labelKey"
        :icon="selectedBanner.icon"
      />
      <!-- TODO: YAML editor -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multi-resource-yaml {
  display: flex;
  height: 100%;

  &__graph {
    flex: 0 0 250px;
  }

  &__editor {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>
