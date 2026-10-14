<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { RouteLocationRaw, useRouter } from 'vue-router';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor.vue';
import ResourceCancelModal from '@shell/components/ResourceCancelModal.vue';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import ManagementBanner from '@shell/components/ResourceYaml/ManagementBanner.vue';
import { ResourceGraphNode } from '@shell/components/ResourceYaml/types';
import { useResourceYamlFolding } from '@shell/composables/useResourceYamlFolding';
import { useSplitResize } from '@shell/composables/useSplitResize';
import { keyForResource } from '@shell/utils/related-resources/resource-key';
import { fromEditorYaml, toEditorYaml } from '@shell/utils/related-resources/yaml';
import { exceptionToErrorsArray, stringify } from '@shell/utils/error';
import { saveWithConflictRetry } from '@shell/plugins/dashboard-store/normalize';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import {
  RelatedResource,
  RelatedResourceBanner,
  RelatedResourceContext,
  RelatedResourcesEditorState,
  ResourceModel,
} from '@shell/core/types';

//  prevent parent layout classes(e.g. cru-resource's .resource-container) from overwriting the grid defined here
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  value: ResourceModel,

  relatedResources: RelatedResource[],

  doneRoute?: string | RouteLocationRaw | null,

  doneOverride?:(() => void) | RouteLocationRaw | null,

  // will be parsed from 'value' if undefined here
  yaml?: string | null,

  // the yaml before the user has made any edits
  initialYamlForDiff?: string | null,


  applyHooks?: ((hooks: string) => Promise<void>) | null,

  // if the user navigated here from a form view offer them buttons to go back to the form view
  // discarding unsaved changes as with the single yaml editor
  showEditAsForm?: boolean,

  // the primary resource has been loaded, and we have loaded enough to know to use this component instead of single yaml
  // but don't yet have the full tree
  loading?: boolean,
}>();

const emit = defineEmits<{ error: [errors: any[]], 'edit-as-form': [] }>();

const store = useStore();
const router = useRouter();
const i18n = useI18n(store);


// this runs after all saving logic so it is very similar to SingleResourceYaml's `done`
const done = () => {
  if (props.doneOverride) {
    return typeof props.doneOverride === 'function' ? props.doneOverride() : router.replace(props.doneOverride);
  }

  if (!props.doneRoute) {
    return;
  }

  router.replace(typeof props.doneRoute === 'object' ? props.doneRoute : { name: props.doneRoute, params: { resource: props.value.type } });
};

// track which resource is currently being shown and the (edited) state of each resource
// passed in to related resources' computed functions (eg banner)
const editorState = reactive<RelatedResourcesEditorState>({
  yaml:     {},
  selected: keyForResource(props.value) || null,
});

const primaryId = computed(() => keyForResource(props.value) || 'primary');


const nodeIdFor = (entry: RelatedResource, i: number): string => entry.nodeId || keyForResource(entry.resource) || String(i);


const relatedIds = computed(() => props.relatedResources.map(nodeIdFor));

// return -1 if not found in relatedResources and treat that as the primary resource
const relatedIndexOf = (nodeId: string | null): number => (nodeId ? relatedIds.value.indexOf(nodeId) : -1);


// the store's copy of the primary resource once saved
// this.value is a local clone (true in form view as well)
const savedPrimary = ref<ResourceModel | null>(null);

const primaryResource = computed<ResourceModel>(() => savedPrimary.value || props.value);

// immutable resources may be replaced with a new version
// keyed by node id to retain selection status and child relationships
const replacedResources = reactive<{ [nodeId: string]: ResourceModel }>({});

watch(() => props.value, (neu) => {
  editorState.selected = keyForResource(neu) || null;
  savedPrimary.value = null;
});

watch(() => props.relatedResources, () => {
  Object.keys(replacedResources).forEach((id) => delete replacedResources[id]);
});


const resourceAt = (i: number): ResourceModel => replacedResources[relatedIds.value[i]] || props.relatedResources[i].resource;

const resourceLabel = (resource: ResourceModel): string => resource?.nameDisplay || resource?.metadata?.name || resource?.id || '';

const resourceFor = (nodeId: string): ResourceModel => (nodeId === primaryId.value ? primaryResource.value : resourceAt(relatedIndexOf(nodeId)));

// the editor yaml of each version of each resource, keyed by `type:id:resourceVersion`
// on a hit only the key and resourceVersion are read, so `initialYamlById` does not depend on the other fields
// a background update of one resource then dumps that resource only
const yamlCache = new Map<string, string>();

const editorYamlOf = (resource: ResourceModel): string => {
  const key = keyForResource(resource);
  const resourceVersion = resource?.metadata?.resourceVersion;

  if (!key || !resourceVersion) {
    return toEditorYaml(resource);
  }

  const cacheKey = `${ key }:${ resourceVersion }`;

  if (!yamlCache.has(cacheKey)) {
    yamlCache.set(cacheKey, toEditorYaml(resource));
  }

  return yamlCache.get(cacheKey) as string;
};

// the yaml for the primary resource initially shown when the form loads
const primaryInitialYaml = computed(() => (savedPrimary.value ? editorYamlOf(savedPrimary.value) : props.yaml || editorYamlOf(props.value)));

// the yaml the primary resource's editor content is compared with, by the diff view and to mark it as edited
// when opened from form view this uses initialYamlForDiff
// otherwise it uses the yaml the editor opens with as you'd expect
// once a resource is successfully saved, the result becomes the new baseline for comparison
const primaryBaselineYaml = computed(() => (savedPrimary.value ? primaryInitialYaml.value : props.initialYamlForDiff || primaryInitialYaml.value));

// the yaml each resource is shown with when it is first opened, keyed by node id
// related resources are the store's models, so this follows them as the store updates them
// it is not what an edit is compared with once the resource has been opened, see `seededYaml`
const initialYamlById = computed<{ [nodeId: string]: string }>(() => ({
  [primaryId.value]: primaryInitialYaml.value,
  ...Object.fromEntries(relatedIds.value.map((id, i) => [id, editorYamlOf(resourceAt(i))])),
}));

// what each entry of `editorState.yaml` is compared with, keyed by node id
// recorded when the entry is added to `editorState.yaml`, and not changed by later store updates
// if the comparison read `initialYamlById` instead, a background update would make the editor content differ from it
// and the resource would be marked as edited, and diffed, though the user changed nothing
// cleared with the entry after a save, so the next comparison is with the saved yaml
const seededYaml = reactive<{ [nodeId: string]: string }>({});

// what the yaml in the editor is compared with, keyed by node id
// used by the diff view, the edited markers and Save All, and given to save hooks as `initialYaml`
// later sources win: a recorded `seededYaml` entry, then the primary's baseline, then the yaml it is shown with
const baselineYamlById = computed<{ [nodeId: string]: string }>(() => ({
  ...initialYamlById.value, [primaryId.value]: primaryBaselineYaml.value, ...seededYaml
}));

// a save function or hook can write the yaml of a resource that was never shown in the editor
// for example saving a machine config writes its changed pool into the provisioning cluster's yaml
// such an entry was not added by `seed`, so it has no recorded baseline
// recording the current baseline for it makes the write show as an edit, compared with the right yaml
const seedUnseededYaml = () => {
  Object.keys(editorState.yaml).forEach((id) => {
    if (!(id in seededYaml) && id in baselineYamlById.value) {
      seededYaml[id] = baselineYamlById.value[id];
    }
  });
};

// gives a resource its entry in `editorState.yaml`, and records the baseline it is compared with
// called the first time the resource is shown, and again after it is saved
const seed = (nodeId: string | null) => {
  if (!nodeId || nodeId in editorState.yaml || !(nodeId in initialYamlById.value)) {
    return;
  }

  seededYaml[nodeId] = baselineYamlById.value[nodeId];
  editorState.yaml[nodeId] = initialYamlById.value[nodeId];
};

const seedShown = () => {
  seed(primaryId.value);
  seed(editorState.selected);
};


watch(() => [editorState.selected, primaryId.value], seedShown, { immediate: true });

// node ids of the resources whose yaml in the editor differs from their baseline
const modifiedIds = computed(() => new Set(
  Object.keys(editorState.yaml).filter((id) => id in baselineYamlById.value && editorState.yaml[id] !== baselineYamlById.value[id])
));

const contextFor = (i: number): RelatedResourceContext => ({
  resource:         resourceAt(i),
  relatedResources: props.relatedResources,
  primaryResource:  primaryResource.value,
  editorState,
  nodeId:           relatedIds.value[i],
  primaryNodeId:    primaryId.value,
  // a getter, so `baselineYamlById` is read only when a banner or hook reads `initialYaml`
  // a banner is a `computed` over this context, see `bannerRefs`
  // a plain property would read `baselineYamlById` for every banner, so every banner would re-run when any resource's yaml changed
  get initialYaml() {
    return baselineYamlById.value;
  },
  saveResource: (nodeId: string) => saveNode(nodeId),
});

// one `computed` per related resource, in the same order as `relatedResources`
// models and extensions give `banner` as a plain function of the context, the `computed` is created here
// each banner then re-evaluates only when state it read changes, not when another resource's yaml changes
// the computeds are created again when `relatedResources` changes
const bannerRefs = computed(() => props.relatedResources.map((entry, i) => computed<RelatedResourceBanner | null>(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(i)) || null;
  } catch (e) {
    console.warn('Failed to resolve banner for related resource', entry.resource?.id, e); // eslint-disable-line no-console

    return null;
  }
})));

const graphNodes = computed<ResourceGraphNode[]>(() => [
  {
    id:       primaryId.value,
    label:    resourceLabel(props.value),
    group:    props.value?.typeDisplay || props.value?.type || undefined,
    modified: modifiedIds.value.has(primaryId.value),
  },
  ...props.relatedResources
    .map((entry, i) => ({ entry, i }))
    .sort((a, b) => Number(!!a.entry.dependent) - Number(!!b.entry.dependent))
    .map(({ entry, i }) => ({
      id:       relatedIds.value[i],
      parentId: entry.parentId || primaryId.value,
      label:    resourceLabel(resourceAt(i)),
      group:    entry.group || (entry.groupKey ? i18n.t(entry.groupKey) : undefined),
      modified: modifiedIds.value.has(relatedIds.value[i]),
      ...(entry.readOnly ? { readOnly: true } : {}),
    })),
]);

// -1 while the primary resource is selected
const selectedIndex = computed(() => relatedIndexOf(editorState.selected));

const selectedEntry = computed<RelatedResource | undefined>(() => props.relatedResources[selectedIndex.value]);

const selectedResource = computed<ResourceModel>(() => (selectedEntry.value ? resourceAt(selectedIndex.value) : primaryResource.value));

const selectedReadOnly = computed(() => !!selectedEntry.value?.readOnly);

const selectedBanner = computed(() => bannerRefs.value[selectedIndex.value]?.value || null);

const selectedModified = computed(() => !!editorState.selected && modifiedIds.value.has(editorState.selected));

// what the diff view compares the editor with: the selected resource's baseline
// falls back to the yaml of the resource for a selection with no baseline
const selectedBaseline = computed(() => (editorState.selected && baselineYamlById.value[editorState.selected]) ?? toEditorYaml(selectedResource.value));


const currentYaml = computed({
  get(): string {
    const id = editorState.selected;

    return (id && editorState.yaml[id]) ?? '';
  },

  set(value: string) {
    if (editorState.selected) {
      editorState.yaml[editorState.selected] = value;
    }
  },
});

// folds the rarely edited sections of the selected resource's yaml
const { foldYaml } = useResourceYamlFolding(selectedResource, () => !selectedReadOnly.value);

const showDiff = ref(false);

// toggle the editor off diff view when users select a new resource or save the current resource
watch([selectedModified, () => editorState.selected], ([modified], [, prevSelected]) => {
  if (!modified || editorState.selected !== prevSelected) {
    showDiff.value = false;
  }
});

const editorMode = computed(() => {
  if (showDiff.value) {
    return EDITOR_MODES.DIFF_CODE;
  }

  return selectedReadOnly.value ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE;
});

const DIFF_MODES = ['unified', 'split'] as const;

const isDiffMode = (diffMode: string, mode: typeof DIFF_MODES[number]) => (diffMode === 'split') === (mode === 'split');

const container = ref<HTMLElement>();
const split = reactive(useSplitResize(container));

// back to form confirmation modal
const cancelModal = ref<{ show:() => void } | null>(null);

const saving = ref(false);

// use to force the yaml editor to remount when the editor's yaml has been replaced (save/conflict resolution on save)
const editorRevision = ref(0);

// saves a resource from its yaml in the editor through its model's `save`
// used for the primary resource, and for a related resource whose entry defines no `save`
// a 409 from a change made in the background, for example to status, is merged with `handleConflict`
// using the baseline as the yaml the edits were made to, then the save is tried once more
const saveClassified = async(resource: ResourceModel, nodeId: string): Promise<ResourceModel> => {
  const baseline = baselineYamlById.value[nodeId];
  const data = fromEditorYaml(resource, editorState.yaml[nodeId] ?? baseline);


  // ResourceDetail's edit yaml hides server-managed metadata, resourceVersion included, see EDIT_HIDDEN_METADATA_KEYS
  // it is restored from the model, as the model's `saveYaml` does
  // without it the save would overwrite changes made since the yaml was made, instead of failing with a 409
  if (data.metadata && !data.metadata.resourceVersion && resource.metadata?.resourceVersion) {
    data.metadata.resourceVersion = resource.metadata.resourceVersion;
  }

  const classified = await resource.$dispatch('create', data);

  await saveWithConflictRetry(classified, fromEditorYaml(resource, baseline), {
    onConflict: (liveValue: ResourceModel) => {
      seededYaml[nodeId] = toEditorYaml(liveValue);
      editorState.yaml[nodeId] = toEditorYaml(liveValue?.status === undefined ? classified : { ...classified, status: liveValue.status });
      editorRevision.value++;
    },
  });

  // falls back to `classified` in case the store doesn't contain a fresh copy
  return classified.$getters['byId'](classified.type, classified.id) || classified;
};

// after saving a new baseline yaml is set and the editor is remounted to pick up the changed resource
const resetEditorState = (nodeId: string) => {
  delete editorState.yaml[nodeId];
  delete seededYaml[nodeId];
  seedShown();
  editorRevision.value++;
};

// the node id of the resource each failed save was for, keyed by the error thrown, so the error shown can name it
// a save hook can save another resource through `saveResource`, so one error can pass through several `saveNode` calls
const failedNodes = new WeakMap<object, string>();


const saveErrors = (err: any): any[] => {
  const nodeId = err && typeof err === 'object' ? failedNodes.get(err) : undefined;

  if (!nodeId) {
    return exceptionToErrorsArray(err);
  }

  const resource = resourceFor(nodeId);
  const kind = resource?.kind || resource?.typeDisplay || resource?.type || '';


  return exceptionToErrorsArray(err).map((error: any) => i18n.t('resourceYaml.errors.saveFailed', {
    kind, name: resourceLabel(resource), error: stringify(error)
  }, true));
};

// saves one resource, and records which resource a failure was for, see `failedNodes`
// a save hook can save another resource through `saveResource` while a save is running
// resolves to the saved resource, or to null when its `beforeSaveHook` cancelled the save
const saveNode = async(nodeId: string): Promise<ResourceModel | null> => {
  try {
    return await saveNodeUnlabelled(nodeId);
  } catch (err) {
    if (err && typeof err === 'object' && !failedNodes.has(err)) {
      failedNodes.set(err, nodeId);
    }

    throw err;
  }
};

const saveNodeUnlabelled = async(nodeId: string): Promise<ResourceModel | null> => {
  if (nodeId === primaryId.value) {
    await props.applyHooks?.(BEFORE_SAVE_HOOKS);
    savedPrimary.value = await saveClassified(primaryResource.value, nodeId);
    resetEditorState(nodeId);
    await props.applyHooks?.(AFTER_SAVE_HOOKS);

    return savedPrimary.value;
  }

  const i = relatedIndexOf(nodeId);

  if (i < 0) {
    throw new Error(`No resource in the editor has the node id ${ nodeId }`);
  }

  const entry = props.relatedResources[i];
  const ctx = contextFor(i);

  if (await entry.beforeSaveHook?.(ctx) === false) {
    return null;
  }

  let saved: ResourceModel;

  try {
    saved = typeof entry.save === 'function' ? await entry.save(ctx) : await saveClassified(ctx.resource, nodeId);
  } finally {
    // an entry's `save` can write the yaml of other resources, for example a machine config's save writes the cluster's yaml
    // likely not a good design, but extensions are not blocked from doing this, so handle it here
    seedUnseededYaml();
  }

  const savedKey = keyForResource(saved);

  if (savedKey && savedKey !== keyForResource(ctx.resource)) {
    replacedResources[nodeId] = saved;
  }

  resetEditorState(nodeId);


  await entry.afterSaveHook?.(contextFor(i));

  return saved || resourceAt(i);
};

// resolves to true when the save left the editor
// resolves to false when the editor is still open: a failed save, or a save of one resource
let pendingSave: Promise<boolean> | null = null;


// runs a save started from a save button: a resource's own Save in the graph, or Save All
const runSave = (save: () => Promise<boolean | void>): Promise<boolean> => {
  pendingSave = (async() => {
    saving.value = true;

    emit('error', []);

    try {
      return !!await save();
    } catch (err) {
      emit('error', saveErrors(err));

      return false;
    } finally {
      seedUnseededYaml();
      saving.value = false;
    }
  })();

  return pendingSave;
};


const saveOne = (nodeId: string) => runSave(async() => {
  await saveNode(nodeId);
});


// node save order for Save All
// dependencies deepest first, so a resource is saved before the resources that use it
// then the primary resource, then its dependents, the resources that use it or that it selects
const saveOrder = computed<string[]>(() => {
  const editable = props.relatedResources
    .map((entry, i) => ({ entry, id: relatedIds.value[i] }))
    .filter(({ entry }) => !entry.readOnly);
  const dependencies = editable
    .filter(({ entry }) => !entry.dependent)
    .sort((a, b) => (b.entry.depth || 1) - (a.entry.depth || 1));
  const dependents = editable.filter(({ entry }) => entry.dependent);

  return [...dependencies, { id: primaryId.value }, ...dependents].map(({ id }) => id);
});

const canSaveAll = computed(() => !saving.value && saveOrder.value.some((id) => modifiedIds.value.has(id)));

const saveAll = () => runSave(async() => {
  for (const nodeId of saveOrder.value) {
    // whether a resource is modified is checked as its turn comes, not once before the loop
    // an earlier save can change another resource, for example a machine config's save writes the cluster's yaml
    // or save it through `saveResource`, after which it is no longer modified
    if (modifiedIds.value.has(nodeId) && !await saveNode(nodeId)) {
      return;
    }
  }

  done();

  return true;
});


const cancel = async() => {
  if (!await pendingSave) {
    done();
  }
};

defineExpose({ editorState });
</script>

<template>
  <div
    ref="container"
    class="multi-yaml-container"
    :class="{ 'multi-yaml-container--resizing': split.resizing, 'multi-yaml-container--view-toggle': showEditAsForm }"
    :style="{ '--graph-width': `${ split.percent }%`, ...split.limits }"
  >
    <div
      v-if="showEditAsForm"
      class="multi-yaml-view-toggle"
      role="group"
      data-testid="multi-yaml-view-toggle"
    >
      <RcButton
        variant="secondary"
        size="small"
        :aria-pressed="false"
        data-testid="multi-yaml-edit-as-form"
        @click="cancelModal?.show()"
      >
        {{ i18n.t('resourceYaml.buttons.editAsForm') }}
      </RcButton>
      <RcButton
        variant="tertiary"
        size="small"
        :aria-pressed="true"
        data-testid="multi-yaml-edit-as-yaml"
      >
        {{ i18n.t('resourceYaml.buttons.editAsYaml') }}
      </RcButton>
    </div>
    <ResourceCancelModal
      v-if="showEditAsForm"
      ref="cancelModal"
      :is-cancel-modal="false"
      :is-form="false"
      @confirm-cancel="emit('edit-as-form')"
    />
    <ResourceGraph
      class="multi-yaml-resource-graph"
      :nodes="graphNodes"
      :selected="editorState.selected"
      :saving="saving"
      :loading="loading"
      @select="editorState.selected = $event"
      @save="saveOne"
    />
    <div
      class="multi-yaml-resize"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-valuemin="Math.round(split.minPercent)"
      :aria-valuemax="split.maxPercent"
      :aria-valuenow="Math.round(split.valueNow)"
      :aria-label="i18n.t('resourceYaml.resourceGraph.resize')"
      data-testid="multi-yaml-resize"
      @pointerdown="split.onPointerdown"
      @pointermove="split.onPointermove"
      @pointerup="split.onPointerup"
      @pointercancel="split.onPointerup"
      @keydown="split.onKeydown"
      @focus="split.onFocus"
    >
      <i
        class="icon icon-lg icon-actions"
        aria-hidden="true"
      />
    </div>
    <div class="multi-yaml-editor-container">
      <Transition
        name="yaml-fade"
        mode="out-in"
      >
        <div
          v-if="editorState.selected"
          :key="`${editorState.selected}-${editorRevision}`"
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
          <!-- use selectedIndex to avoid showing the mgmt banner for the primary resource - ResourceDetailMasthead covers this -->
          <ManagementBanner
            v-if="selectedIndex > 0"
            :resource="selectedResource"
            :read-only="selectedReadOnly"
            :primary-resource="primaryResource"
            :ignore-controller="!!selectedEntry?.ignoreController"
          />
          <div class="multi-yaml-code">
            <Transition
              name="yaml-fade"
              mode="out-in"
            >
              <YamlEditor
                :key="String(showDiff)"
                v-model:value="currentYaml"
                :initial-yaml-values="selectedBaseline"
                :editor-mode="editorMode"
                :diff-context="Number.MAX_SAFE_INTEGER"
                @onReady="foldYaml"
              >
                <template #preview-buttons="{ diffMode, setDiffMode }">
                  <div
                    class="multi-yaml-diff-mode"
                    data-testid="multi-yaml-diff-mode"
                  >
                    <RcButton
                      v-for="mode in DIFF_MODES"
                      :key="mode"
                      size="small"
                      :variant="isDiffMode(diffMode, mode) ? 'tertiary' : 'secondary'"
                      :aria-pressed="isDiffMode(diffMode, mode)"
                      @click="setDiffMode(mode)"
                    >
                      {{ i18n.t(`generic.${ mode }`) }}
                    </RcButton>
                  </div>
                </template>
              </YamlEditor>
            </Transition>
            <RcButton
              v-if="selectedModified"
              variant="tertiary"
              size="small"
              class="multi-yaml-diff-toggle"
              :aria-pressed="showDiff"
              data-testid="multi-yaml-diff-toggle"
              @click="showDiff = !showDiff"
            >
              {{ i18n.t(showDiff ? 'resourceYaml.buttons.hideDiff' : 'resourceYaml.buttons.diff') }}
            </RcButton>
          </div>
        </div>
      </Transition>
    </div>
    <div class="multi-yaml-footer">
      <RcButton
        variant="secondary"
        data-testid="multi-yaml-cancel"
        @click="cancel"
      >
        {{ i18n.t('generic.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        :disabled="!canSaveAll"
        data-testid="multi-yaml-save"
        @click="saveAll"
      >
        {{ i18n.t('resourceYaml.buttons.saveAll') }}
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multi-yaml-container {
  display: grid;
  grid-template-columns: clamp(var(--split-min), var(--graph-width), var(--split-max)) 16px 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "graph resize editor"
    "footer footer footer";
  row-gap: 16px;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;

  &--resizing {
    cursor: col-resize;
    user-select: none;
  }

  @media (max-width: map-get($breakpoints, '--viewport-7')) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr auto;
    grid-template-areas:
      "graph"
      "editor"
      "footer";
  }

  &--view-toggle {
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "toggle toggle toggle"
      "graph resize editor"
      "footer footer footer";

    @media (max-width: map-get($breakpoints, '--viewport-7')) {
      grid-template-rows: auto 1fr 2fr auto;
      grid-template-areas:
        "toggle"
        "graph"
        "editor"
        "footer";
    }
  }
}

.multi-yaml-view-toggle {
  grid-area: toggle;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.multi-yaml-resource-graph,
.multi-yaml-editor-container {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.multi-yaml-resource-graph {
  grid-area: graph;
}


.multi-yaml-resize {
  grid-area: resize;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: col-resize;
  touch-action: none;
  color: var(--primary);

  &:focus-visible {
    @include focus-outline;
  }

  @media (max-width: map-get($breakpoints, '--viewport-7')) {
    display: none;
  }
}

.multi-yaml-editor-container {
  grid-area: editor;
  display: flex;
  flex-direction: column;
  background-color: var(--rc-cm-bg);
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


  &--diff :deep(.yaml-editor) {
    overflow: hidden;
  }
}

.multi-yaml-code {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}


.multi-yaml-diff-mode {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  display: flex;
  gap: 8px;
}

.multi-yaml-diff-toggle {
  position: absolute;
  top: 8px;
  right: 17px;
  z-index: 1;
}


.yaml-fade-leave-active {
  transition: opacity 0.1s;
}

.yaml-fade-leave-to {
  opacity: 0;
}


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
  grid-area: footer;
  padding: 12px var(--gap);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
