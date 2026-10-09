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
import { keyForResource } from '@shell/utils/resource-key';
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

// parent layout classes (e.g. cru-resource's .resource-container) would override the root grid
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  value: ResourceModel,

  /** edited alongside `value`, each carrying its own save hooks, banner and groupKey */
  relatedResources: RelatedResource[],

  /** where to go once every resource is saved: a route name for `value`'s type, or a route */
  doneRoute?: string | RouteLocationRaw | null,

  /** called, or navigated to, in place of `doneRoute` */
  doneOverride?:(() => void) | RouteLocationRaw | null,

  /** the yaml of `value` made by the parent, as SingleResourceYaml shows it. Made from `value` when not given */
  yaml?: string | null,

  /** what the yaml of `value` is compared with, e.g. the yaml from before the edits made in a form. `yaml` when not given */
  initialYamlForDiff?: string | null,

  /** runs the save hooks the parent's form registered, as in SingleResourceYaml */
  applyHooks?: ((hooks: string) => Promise<void>) | null,

  /** the yaml is shown in place of a form, so going back to the form is offered */
  showEditAsForm?: boolean,
}>();

const emit = defineEmits<{ error: [errors: any[]], 'edit-as-form': [] }>();

const store = useStore();
const router = useRouter();
const i18n = useI18n(store);

// as SingleResourceYaml's `done`
const done = () => {
  if (props.doneOverride) {
    return typeof props.doneOverride === 'function' ? props.doneOverride() : router.replace(props.doneOverride);
  }

  if (!props.doneRoute) {
    return;
  }

  router.replace(typeof props.doneRoute === 'object' ? props.doneRoute : { name: props.doneRoute, params: { resource: props.value.type } });
};

// handed to the related resources' compute functions and save hooks
// tracks which resource is currently shown in the yaml editor, as well as yaml editor state for each resource
const editorState = reactive<RelatedResourcesEditorState>({
  yaml:     {},
  selected: keyForResource(props.value) || null,
});

const primaryId = computed(() => keyForResource(props.value) || 'primary');

// `nodeId` is set when the tree was flattened; the fallbacks let a plain list work unflattened
const nodeIdFor = (entry: RelatedResource, i: number): string => entry.nodeId || keyForResource(entry.resource) || String(i);

// the node id of each entry of `relatedResources`, in the same order
const relatedIds = computed(() => props.relatedResources.map(nodeIdFor));

// -1 for the primary resource, which has no entry in `relatedResources`
const relatedIndexOf = (nodeId: string | null): number => (nodeId ? relatedIds.value.indexOf(nodeId) : -1);

// the store's copy of the primary resource once saved
// `value` is a clone for editing, which the save does not update
const savedPrimary = ref<ResourceModel | null>(null);

const primaryResource = computed<ResourceModel>(() => savedPrimary.value || props.value);

// resources a save created in place of the one loaded, for example a replacement for an immutable resource, keyed by node id
// the node keeps its id, so its selection and children stay attached to it
const replacedResources = reactive<{ [nodeId: string]: ResourceModel }>({});

watch(() => props.value, (neu) => {
  editorState.selected = keyForResource(neu) || null;
  savedPrimary.value = null;
});

watch(() => props.relatedResources, () => {
  Object.keys(replacedResources).forEach((id) => delete replacedResources[id]);
});

// the resource of the entry at index `i` of `relatedResources`
const resourceAt = (i: number): ResourceModel => replacedResources[relatedIds.value[i]] || props.relatedResources[i].resource;

const resourceLabel = (resource: ResourceModel): string => resource?.nameDisplay || resource?.metadata?.name || resource?.id || '';

// the resource of a node: the primary resource or a related one
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

// the parent's yaml describes `value`, not the saved resource
const primaryInitialYaml = computed(() => (savedPrimary.value ? editorYamlOf(savedPrimary.value) : props.yaml || editorYamlOf(props.value)));

// differs from `primaryInitialYaml` when the yaml was made after edits in a form, so those edits show as modified
const primaryBaselineYaml = computed(() => (savedPrimary.value ? primaryInitialYaml.value : props.initialYamlForDiff || primaryInitialYaml.value));

// the yaml each resource is shown with, keyed by node id
// the store updates it in the background, e.g. status after a save
const initialYamlById = computed<{ [nodeId: string]: string }>(() => ({
  [primaryId.value]: primaryInitialYaml.value,
  ...Object.fromEntries(relatedIds.value.map((id, i) => [id, editorYamlOf(resourceAt(i))])),
}));

// what each entry of `editorState.yaml` is compared with, keyed by node id
// fixed when the entry is added, so a background update to `initialYamlById` does not mark the resource modified
const seededYaml = reactive<{ [nodeId: string]: string }>({});

// what the yaml in the editor is compared with, for the diff view and to find the modified resources
const baselineYamlById = computed<{ [nodeId: string]: string }>(() => ({
  ...initialYamlById.value, [primaryId.value]: primaryBaselineYaml.value, ...seededYaml
}));

// a save function can write the yaml of a resource that was never shown in the editor
const seedUnseededYaml = () => {
  Object.keys(editorState.yaml).forEach((id) => {
    if (!(id in seededYaml) && id in baselineYamlById.value) {
      seededYaml[id] = baselineYamlById.value[id];
    }
  });
};

// gives a resource its entry in `editorState.yaml`, the first time it is shown and again after it is saved
const seed = (nodeId: string | null) => {
  if (!nodeId || nodeId in editorState.yaml || !(nodeId in initialYamlById.value)) {
    return;
  }

  seededYaml[nodeId] = baselineYamlById.value[nodeId];
  editorState.yaml[nodeId] = initialYamlById.value[nodeId];
};

// the primary resource is seeded whether shown or not
// its baseline can differ from its initial yaml, so a save function reading `initialYaml` for it would read the wrong yaml
const seedShown = () => {
  seed(primaryId.value);
  seed(editorState.selected);
};

// a watcher rather than the getter of `currentYaml`, so rendering does not write state
watch(() => [editorState.selected, primaryId.value], seedShown, { immediate: true });

// ids of resources whose editor content differs from what it started from
// a resource never opened in the editor has no entry in `editorState.yaml`, so is not modified
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
  // a getter, so a banner reading nothing from it does not re-evaluate when any resource changes
  get initialYaml() {
    return baselineYamlById.value;
  },
  saveResource: (nodeId: string) => saveNode(nodeId),
});

// one `computed` per related resource, in the same order as `relatedResources`
// so a banner re-evaluates only when the state it read changes
// extensions define a plain function, the `computed` is created here
const bannerRefs = computed(() => props.relatedResources.map((entry, i) => computed<RelatedResourceBanner | null>(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(i)) || null;
  } catch (e) {
    // TODO nb localize? Growl?
    console.warn('Failed to resolve banner for related resource', entry.resource?.id, e); // eslint-disable-line no-console

    return null;
  }
})));

// the primary resource is the root of the graph
// a related resource without `parentId` is shown below it, one with `parentId` below the resource that contributed it
// dependencies are listed before dependents, the order they are saved in
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

// what the diff view compares the editor with
const selectedBaseline = computed(() => (editorState.selected && baselineYamlById.value[editorState.selected]) ?? toEditorYaml(selectedResource.value));

// what is currently displayed in the yaml editor, see `seed`
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

// runs on every mount of the editor: selecting a resource, leaving diff view and saving each remount it
// `status` is folded only while editable, as in SingleResourceYaml
const { foldYaml } = useResourceYamlFolding(selectedResource, () => !selectedReadOnly.value);

const showDiff = ref(false);

// a diff with no changes is empty, so leave diff view once there is nothing to compare
// switching resource also leaves it, so the next resource opens ready to edit
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

// YamlEditor shows a unified diff for any `diffMode` other than split
const isDiffMode = (diffMode: string, mode: typeof DIFF_MODES[number]) => (diffMode === 'split') === (mode === 'split');

const container = ref<HTMLElement>();
const split = reactive(useSplitResize(container));

// asks before going back to the form, as the yaml edits are lost
const cancelModal = ref<{ show:() => void } | null>(null);

const saving = ref(false);

// YamlEditor reads `value` only in data(), so a saved resource needs a remount to show its new yaml
const editorRevision = ref(0);

// the primary resource, and a related resource that defines no `save`, are saved by their own model's `save`
// the yaml is classified in the resource's own store for that, with the steve fields the yaml leaves out
// a resource that was never opened is saved from its baseline yaml
// a 409 from a change made in the background, e.g. to status, is resolved against the baseline, the yaml the edits were made to
const saveClassified = async(resource: ResourceModel, nodeId: string): Promise<ResourceModel> => {
  const baseline = baselineYamlById.value[nodeId];
  const data = fromEditorYaml(resource, editorState.yaml[nodeId] ?? baseline);

  // the parent's yaml has no resourceVersion, so it is restored as in the model's `saveYaml`
  // without it the save overwrites changes made since the yaml was made, instead of failing with a 409
  if (data.metadata && !data.metadata.resourceVersion && resource.metadata?.resourceVersion) {
    data.metadata.resourceVersion = resource.metadata.resourceVersion;
  }

  const classified = await resource.$dispatch('create', data);

  await saveWithConflictRetry(classified, fromEditorYaml(resource, baseline), {
    // the server's version with the user's other changes is shown, compared with the server's version
    // so the conflict banner describes the editor, and the next save does not conflict on the same fields again
    // `handleConflict` leaves `status` out of the merge, so it is taken from the server too
    onConflict: (liveValue: ResourceModel) => {
      seededYaml[nodeId] = toEditorYaml(liveValue);
      editorState.yaml[nodeId] = toEditorYaml(liveValue?.status === undefined ? classified : { ...classified, status: liveValue.status });
      editorRevision.value++;
    },
  });

  // the save updates the store's copy, not `classified`
  return classified.$getters['byId'](classified.type, classified.id) || classified;
};

// the saved resource is the new initial state, so the editor is seeded from it again
const resetEditorState = (nodeId: string) => {
  delete editorState.yaml[nodeId];
  delete seededYaml[nodeId];
  seedShown();
  editorRevision.value++;
};

// the node of the resource each failed save was for, so the error can name it
// the innermost node where a save hook saved another resource, as it records the error first
// kept apart from the error, so `saveResource` rejects with the error the save threw
// an error that is not an object can not be a key, and is shown without a name
const failedNodes = new WeakMap<object, string>();

// the errors of a failed save, each prefixed with the kind and name of the resource
const saveErrors = (err: any): any[] => {
  const nodeId = err && typeof err === 'object' ? failedNodes.get(err) : undefined;

  if (!nodeId) {
    return exceptionToErrorsArray(err);
  }

  const resource = resourceFor(nodeId);
  const kind = resource?.kind || resource?.typeDisplay || resource?.type || '';

  // raw, as the error banner escapes its label
  return exceptionToErrorsArray(err).map((error: any) => i18n.t('resourceYaml.errors.saveFailed', {
    kind, name: resourceLabel(resource), error: stringify(error)
  }, true));
};

// saves one resource without setting `saving`, so a save hook can save another one through `saveResource`
// resolves to null when the `beforeSaveHook` cancelled the save
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
    // as SingleResourceYaml's `save`, for the hooks registered by the form the yaml was made from
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
    // the save can write the yaml of other resources, e.g. the primary resource's
    seedUnseededYaml();
  }

  const savedKey = keyForResource(saved);

  if (savedKey && savedKey !== keyForResource(ctx.resource)) {
    replacedResources[nodeId] = saved;
  }

  resetEditorState(nodeId);

  // a new context, so `resource` is the replacement where the save replaced the resource
  await entry.afterSaveHook?.(contextFor(i));

  return saved || resourceAt(i);
};

// the running save, kept so cancel can wait for it
// resolves to true when the save left the editor, as save all does once every resource is saved
let pendingSave: Promise<boolean> | null = null;

// one save at a time, started from a save button
const runSave = (save: () => Promise<boolean | void>): Promise<boolean> => {
  pendingSave = (async() => {
    saving.value = true;
    // the editor stays open after a save, so errors from the previous save are cleared
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

// resolves to nothing, as saving one resource stays in the editor
const saveOne = (nodeId: string) => runSave(async() => {
  await saveNode(nodeId);
});

// dependencies deepest first, then the primary resource, then the resources that use it
// read-only resources are shown in view mode, so are never modified
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
    // checked for each resource, as a save can save or change another one, e.g. the primary resource
    if (modifiedIds.value.has(nodeId) && !await saveNode(nodeId)) {
      return;
    }
  }

  done();

  return true;
});

// a running save finishes first, its after save hooks included, as `saveNode` awaits them
const cancel = async() => {
  if (!await pendingSave) {
    done();
  }
};

// the save path and the parent both read the editor's unsaved state
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
          <ManagementBanner
            :resource="selectedResource"
            :read-only="selectedReadOnly"
            :primary-resource="primaryResource"
          />
          <div class="multi-yaml-code">
            <!-- YamlEditor remounts when mode changes, the diff toggle stays mounted so it keeps focus -->
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
  // --graph-width and the --split-* limits are set from useSplitResize, which also reports them to assistive technology
  grid-template-columns: clamp(var(--split-min), var(--graph-width), var(--split-max)) 16px 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "graph resize editor"
    "footer footer footer";
  row-gap: 16px;

  // fill vertical space below the masthead - graph and editor scroll independently
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;

  // the pointer can leave the separator while dragging, so the cursor is set on the whole container
  // user-select stops the drag from selecting text in the graph and editor
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

  // a row of its own, as an empty grid row would still add a row-gap
  // after the base rules, which have the same specificity
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

// the icon is centred in the 16px column, the whole column receives the pointer
.multi-yaml-resize {
  grid-area: resize;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: col-resize;
  // on touch screens a drag moves the separator instead of scrolling the page
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

  // FileDiff scrolls itself: it sets its own height in fit() and has overflow: auto
  &--diff :deep(.yaml-editor) {
    overflow: hidden;
  }
}

// the editor scrolls inside this, so the diff toggle stays in the top-right corner
.multi-yaml-code {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// over the top-left corner of the editor, opposite the diff toggle, in place of YamlEditor's row above the diff
// positioned against .multi-yaml-code, outside the overflow of the diff, so it stays in place as the diff scrolls
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
  grid-area: footer;
  padding: 12px var(--gap);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
