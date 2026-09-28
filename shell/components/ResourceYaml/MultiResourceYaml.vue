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
import CreateRelatedResourceDrawer from '@shell/components/ResourceYaml/CreateRelatedResourceDrawer.vue';
import { RelatedResourceType, ResourceGraphNode } from '@shell/components/ResourceYaml/types';
import { keyForResource } from '@shell/utils/resource-key';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { _CLONE } from '@shell/config/query-params';
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

const emit = defineEmits<{ error: [errors: any[]] }>();

const store = useStore();
const i18n = useI18n(store);

// handed to the related resources' compute functions and save hooks
// tracks which resource is currently shown in the yaml editor, as well as yaml editor state for each resource
const editorState = reactive<EditableRelatedResourcesEditorState>({
  yaml:     {},
  selected: keyForResource(props.value) || null,
});

// the store's copy of the primary resource once saved
// `value` is a clone for editing, which the save does not update
const savedPrimary = ref<EditableResource | null>(null);

const primaryResource = computed<EditableResource>(() => savedPrimary.value || props.value);

// resources created in the editor, each with a copy of the entry whose `save` created it
const createdEntries = ref<EditableRelatedResource[]>([]);

watch(() => props.value, (neu) => {
  editorState.selected = keyForResource(neu) || null;
  savedPrimary.value = null;
  createdEntries.value = [];
});

// `relatedResources`, then the created resources it does not include
const allRelatedResources = computed<EditableRelatedResource[]>(() => {
  const keys = new Set(props.relatedResources.map((entry) => keyForResource(entry.resource)));

  return [...props.relatedResources, ...createdEntries.value.filter((entry) => !keys.has(keyForResource(entry.resource)))];
});

const contextFor = (entry: EditableRelatedResource, i: number): EditableRelatedResourceContext => ({
  resource:         resourceFor(entry, i),
  relatedResources: allRelatedResources.value,
  primaryResource:  primaryResource.value,
  editorState,
  nodeId:           nodeIdFor(entry, i),
  primaryNodeId:    primaryId.value,
  // a getter, so a banner reading nothing from it does not re-evaluate when any resource changes
  get initialYaml() {
    return baselineYamlById.value;
  },
});

// one `computed` per related resource, in the same order as `relatedResources`
// per-banner `computed` limits re-evaluation to the state each banner actually read
// computed props are initialized here for better extension compatibility (ext only need to define plain functions)
const bannerRefs = computed<ComputedRef<EditableRelatedResourceBanner | null>[]>(() => allRelatedResources.value.map((entry, i) => computed(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(entry, i)) || null;
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

// resources a save created in place of the one loaded, for example a replacement for an immutable resource, keyed by `nodeId`
// the node keeps its `nodeId`, so its selection and children stay attached to it
const replacedResources = reactive<{ [nodeId: string]: EditableResource }>({});

watch(() => props.relatedResources, () => {
  Object.keys(replacedResources).forEach((id) => delete replacedResources[id]);
});

const resourceFor = (entry: EditableRelatedResource, i: number): EditableResource => replacedResources[nodeIdFor(entry, i)] || entry.resource;

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
  const out: { [nodeId: string]: string } = { [primaryId.value]: initialYamlFor(primaryResource.value) };

  allRelatedResources.value.forEach((entry, i) => {
    out[nodeIdFor(entry, i)] = initialYamlFor(resourceFor(entry, i));
  });

  return out;
});

// the yaml each entry of `editorState.yaml` started from, keyed by `nodeId`
// fixed when the entry is added, as the store updates `initialYamlById` in the background (e.g. status after a save)
const seededYaml = reactive<{ [nodeId: string]: string }>({});

// what the yaml in the editor is compared with, for the diff view and to find the modified resources
const baselineYamlById = computed<{ [nodeId: string]: string }>(() => ({ ...initialYamlById.value, ...seededYaml }));

// a save function can write the yaml of a resource that was never shown in the editor
const seedUnseededYaml = () => {
  Object.keys(editorState.yaml).forEach((id) => {
    if (!(id in seededYaml) && id in initialYamlById.value) {
      seededYaml[id] = initialYamlById.value[id];
    }
  });
};

// ids of resources whose editor content differs from what it started from
// a resource never opened in the editor has no entry in `editorState.yaml`, so is not modified
const modifiedIds = computed(() => new Set(
  Object.keys(editorState.yaml).filter((id) => id in baselineYamlById.value && editorState.yaml[id] !== baselineYamlById.value[id])
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

  const related: ResourceGraphNode[] = allRelatedResources.value.map((entry, i) => {
    const id = nodeIdFor(entry, i);

    return {
      id,
      parentId: entry.parentId || primaryId.value,
      label:    resourceLabel(resourceFor(entry, i)),
      group:    entry.group || (entry.groupKey ? i18n.t(entry.groupKey) : undefined),
      modified: modifiedIds.value.has(id),
    };
  });

  return [primary, ...related];
});

// the yaml ResourceDetail prepares for a resource cloned from its detail page
// `cleanYaml` outside edit mode removes what a new resource must not have, e.g. name and status
const cloneYamlOf = async(resource: EditableResource): Promise<string> => {
  const yaml = resource.hasLink('view') ? (await resource.followLink('view', { headers: { accept: 'application/yaml' } })).data : saferDump(resource);
  const downloaded = await resource.cleanForDownload(yaml, { editing: true });

  return resource.cleanYaml(downloaded, _CLONE) || '';
};

const cloneYamlFor = async(entry: EditableRelatedResource, i: number): Promise<string> => {
  const ctx = contextFor(entry, i);

  return typeof entry.clone === 'function' ? await entry.clone(ctx) : await cloneYamlOf(ctx.resource);
};

// two stores can have a type of the same name, for example `secret`
const typeKeyFor = (resource: EditableResource): string => `${ resource?.$state?.config?.namespace }/${ resource?.type }`;

// one entry per type of the related resources, excluding the primary resource's type
const relatedTypes = computed<RelatedResourceType[]>(() => {
  const primaryTypeKey = typeKeyFor(props.value);
  const byKey = new Map<string, RelatedResourceType>();

  allRelatedResources.value.forEach((entry, i) => {
    const resource = resourceFor(entry, i);
    const key = typeKeyFor(resource);

    if (!resource?.type || key === primaryTypeKey) {
      return;
    }

    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        type:    resource.type,
        label:   resource.typeDisplay || resource.type,
        resource,
        sources: [],
        save:    (yaml: string) => saveNew(entry, i, yaml),
      });
    }

    byKey.get(key)?.sources.push({
      id:        nodeIdFor(entry, i),
      label:     resourceLabel(resource),
      cloneYaml: () => cloneYamlFor(entry, i),
    });
  });

  // vue3-jest compiles to es5, where spreading an iterator gives an empty array
  return Array.from(byKey.values());
});

// the model's `canCreate` checks the schema's collection methods and the type-map's `isCreatable`
const creatableTypes = computed(() => relatedTypes.value.filter(({ resource }) => resource.canCreate));

const openCreateDrawer = () => {
  store.commit('slideInPanel/open', {
    component:      CreateRelatedResourceDrawer,
    componentProps: {
      types:               creatableTypes.value,
      namespace:           props.value?.metadata?.namespace,
      onClose:             () => store.commit('slideInPanel/close'),
      width:               'wide',
      height:              'full',
      closeOnRouteChange:  ['name', 'params', 'query'],
      returnFocusSelector: '[data-testid="resource-graph-create"]',
    }
  });
};

// -1 when the primary resource is selected
// TODO nb why negative 1
const selectedRelatedIndex = computed(() => allRelatedResources.value.findIndex(
  (entry, i) => nodeIdFor(entry, i) === editorState.selected
));

const selectedBanner = computed(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? bannerFor(idx) : null;
});

const selectedResource = computed<EditableResource>(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? resourceFor(allRelatedResources.value[idx], idx) : primaryResource.value;
});

// what is currently displayed in the yaml editor
const currentYaml = computed({
  get(): string {
    const id = editorState.selected;

    if (!id) {
      return '';
    }

    if (!(id in editorState.yaml)) {
      const initial = initialYamlById.value[id] ?? initialYamlFor(selectedResource.value);

      seededYaml[id] = initial;
      editorState.yaml[id] = initial;
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

const saving = ref(false);

// YamlEditor reads `value` only in data(), so a saved resource needs a remount to show its new yaml
const editorRevision = ref(0);

const canSaveSelected = computed(() => selectedModified.value && !saving.value);

// the primary resource, and a related resource that defines no `save`, are saved by their own model's `save`
// the edited yaml is classified in the resource's own store for that
const saveClassified = async(resource: EditableResource, yaml: string): Promise<EditableResource> => {
  const classified = await resource.$dispatch('create', jsyaml.load(yaml));

  await classified.save();

  // the save updates the store's copy, not `classified`
  return classified.$getters['byId'](classified.type, classified.id) || classified;
};

const saveRelated = async(idx: number) => {
  const entry = allRelatedResources.value[idx];
  const ctx = contextFor(entry, idx);

  await entry.beforeSaveHook?.(ctx);

  const saved = typeof entry.save === 'function' ? await entry.save(ctx) : await saveClassified(ctx.resource, ctx.editorState.yaml[ctx.nodeId] ?? ctx.initialYaml[ctx.nodeId]);
  const savedKey = keyForResource(saved);

  if (savedKey && savedKey !== keyForResource(ctx.resource)) {
    replacedResources[ctx.nodeId] = saved;
  }

  await entry.afterSaveHook?.(ctx);
};

// the `nodeId` given to the save of a new resource, which no entry has
const NEW_NODE_ID = 'new';

// a new resource has no entry, so it is saved by the save hooks and `save` of another resource of its type
// once saved it is shown with a copy of that entry
const saveNew = async(entry: EditableRelatedResource, i: number, yaml: string): Promise<EditableResource> => {
  const existing = resourceFor(entry, i);
  // a model is classified by `type`, which the yaml of a new resource does not have
  const data = { ...(jsyaml.load(yaml) as object), type: existing.type };
  const newYaml = saferDump(data);

  const ctx: EditableRelatedResourceContext = {
    ...contextFor(entry, i),
    resource:    await existing.$dispatch('create', data),
    nodeId:      NEW_NODE_ID,
    isNew:       true,
    initialYaml: { ...baselineYamlById.value, [NEW_NODE_ID]: newYaml },
  };

  try {
    await entry.beforeSaveHook?.(ctx);

    const saved = typeof entry.save === 'function' ? await entry.save(ctx) : await saveClassified(ctx.resource, newYaml);
    // the store's copy, which websocket updates keep current
    const stored = saved?.$getters?.['byId']?.(saved.type, saved.id) || saved;

    createdEntries.value.push({
      ...entry,
      resource: stored,
      nodeId:   keyForResource(stored) || `${ NEW_NODE_ID }-${ createdEntries.value.length }`,
    });

    await entry.afterSaveHook?.(ctx);

    return stored;
  } finally {
    // the save can write the yaml of other resources, e.g. the primary resource's, including the one in the editor
    seedUnseededYaml();
    editorRevision.value++;
  }
};

const saveSelected = async() => {
  const nodeId = editorState.selected;

  if (!nodeId) {
    return;
  }

  const idx = selectedRelatedIndex.value;

  saving.value = true;

  try {
    if (idx >= 0) {
      await saveRelated(idx);
    } else {
      savedPrimary.value = await saveClassified(primaryResource.value, editorState.yaml[nodeId] ?? initialYamlById.value[nodeId]);
    }

    // the saved resource is the new initial state, so the editor is seeded from it again
    delete editorState.yaml[nodeId];
    delete seededYaml[nodeId];
    editorRevision.value++;
  } catch (err) {
    emit('error', exceptionToErrorsArray(err));
  } finally {
    seedUnseededYaml();
    saving.value = false;
  }
};

// the save path and the parent both read the editor's unsaved state
defineExpose({ editorState });
</script>

<template>
  <div class="multi-yaml-container">
    <ResourceGraph
      class="multi-yaml-resource-graph"
      :nodes="graphNodes"
      :selected="editorState.selected"
      :can-create="creatableTypes.length > 0"
      @select="editorState.selected = $event"
      @create="openCreateDrawer"
    />
    <div class="multi-yaml-editor-container">
      <Transition
        name="yaml-fade"
        mode="out-in"
      >
        <!-- YamlEditor reads `value` into the diff only in data(), so it must remount when the mode changes -->
        <div
          v-if="editorState.selected"
          :key="`${editorState.selected}-${showDiff}-${editorRevision}`"
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
            :initial-yaml-values="baselineYamlById[editorState.selected] ?? initialYamlFor(selectedResource)"
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
      <RcButton
        variant="primary"
        :disabled="!canSaveSelected"
        data-testid="multi-yaml-save"
        @click="saveSelected"
      >
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
