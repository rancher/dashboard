<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Selector } from '@shell/types/fleet';
import { FLEET, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { FLEET as FLEET_LABELS, CAPI } from '@shell/config/labels-annotations';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { PaginationParamFilter, PaginationParamProjectOrNamespace, PaginationFilterEquality } from '@shell/types/store/pagination.types';
import { LabelSelectPaginationFunctionOptions } from '@shell/components/form/labeled-select-utils/labeled-select.utils';
import { ResourceLabeledSelectPaginateSettings, ResourceLabeledSelectSettings } from '@shell/types/components/resourceLabeledSelect';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';
import MatchExpressions from '@shell/components/form/MatchExpressions.vue';
import { RcButton } from '@components/RcButton';

interface SelectOption {
  label: string,
  value: string,
  disabled?: boolean,
}

const props = withDefaults(defineProps<{
  selectedClusters?: string[];
  selectedClusterGroups?: string[];
  clusterSelectors?: Selector[];
  clusterGroupsOptions?: SelectOption[];
  /**
   * Workspace namespace - scopes the paginated cluster select server-side.
   */
  namespace?: string;
  /**
   * When false, Harvester clusters are excluded from the cluster select.
   */
  areHarvesterHostsVisible?: boolean;
  mode: string;
  isView?: boolean;
  variant?: 'appco' | 'default';
  compact?: boolean;
}>(), {
  selectedClusters:         () => [],
  selectedClusterGroups:    () => [],
  clusterSelectors:         () => [],
  clusterGroupsOptions:     () => [],
  namespace:                '',
  areHarvesterHostsVisible: false,
  isView:                   false,
  variant:                  'default',
  compact:                  false,
});

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'select-clusters', list: string[]): void;
  (e: 'select-cluster-groups', list: string[]): void;
  (e: 'add-match-expressions'): void;
  (e: 'update-match-expressions', index: number, value: Selector, key?: number): void;
  (e: 'remove-match-expressions', key?: number): void;
}>();

const store = useStore();
const { t } = useI18n(store);

// Cluster options use the friendly display name for both label and value (preserving the existing
// target round-trip), so map raw/paginated cluster resources to that shape.
const clusterDisplayName = (c: any): string => c?.nameDisplay ?? (c?.metadata?.labels?.[FLEET_LABELS.CLUSTER_DISPLAY_NAME] || c?.metadata?.name);

const clusterOptionFromResource = (c: any): SelectOption => {
  const name = clusterDisplayName(c);

  return { label: name, value: name };
};

// Mirrors Fleet's own "exclude harvester" rule - provider.cattle.io NOT IN (harvester). Only the
// label column is filterable server-side (status.provider isn't an indexed column for fleet clusters).
const harvesterFilterField = () => PaginationParamFilter.createSingleField({
  field:    `metadata.labels[${ CAPI.PROVIDER }]`,
  value:    VIRTUAL_HARVESTER_PROVIDER,
  equality: PaginationFilterEquality.NOT_IN,
});

// Paginated path: scope the request to the workspace namespace and (optionally) exclude Harvester
// clusters server-side, then map results to select options.
const paginatedClusterSettings = computed<ResourceLabeledSelectPaginateSettings>(() => ({
  requestSettings: (opts: LabelSelectPaginationFunctionOptions) => ({
    ...opts,
    groupByNamespace: false,
    filters:          [
      ...(opts.filters || []),
      new PaginationParamProjectOrNamespace({ projectOrNamespace: [props.namespace] }),
      ...(props.areHarvesterHostsVisible ? [] : [harvesterFilterField()]),
    ],
  }),
  updateResources: (rows: any[]) => rows.map(clusterOptionFromResource),
}));

// Non-paginated fallback (SSP off): findAll returns every cluster, so filter to namespace + Harvester
// visibility client-side, matching the previous behaviour.
const allClusterSettings = computed<ResourceLabeledSelectSettings>(() => ({
  updateResources: (all: any[]) => all
    .filter((c) => c.metadata?.namespace === props.namespace && (props.areHarvesterHostsVisible || !isHarvesterCluster(c)))
    .map(clusterOptionFromResource),
}));

const isAppco = computed(() => props.variant === 'appco');

const byLabelHeading = computed(() => {
  if (isAppco.value) {
    return 'h4';
  }

  return props.compact ? 'h5' : 'h4';
});

const groupHeading = computed(() => {
  if (isAppco.value) {
    return 'h4';
  }

  return props.compact ? 'h4' : 'h3';
});

const addButtonClass = computed(() => (isAppco.value ? 'mmt-3' : 'mmt-4'));

const matchExpressionRefs = ref<Record<number, any>>({});

function setMatchExpressionRef(key: number | undefined, el: any) {
  if (key === null || key === undefined) {
    return;
  }

  if (el) {
    matchExpressionRefs.value[key] = el;
  } else {
    delete matchExpressionRefs.value[key];
  }
}

function focusMatchExpression(key: number) {
  nextTick(() => {
    matchExpressionRefs.value[key]?.focus();
  });
}

defineExpose({ focusMatchExpression });
</script>

<template>
  <div :class="isAppco ? 'appco-select-clusters' : undefined">
    <!-- Select by cluster name -->
    <!-- The underlying select doesn't preventDefault on Enter, so inside a <form> it would trigger an
         implicit submit (firing the first button, e.g. "Add cluster selector"). Catch Enter in the
         capture phase - before the select stops propagation - and prevent that default submit. -->
    <div @keydown.enter.capture.prevent>
      <h4 v-if="isAppco">
        {{ t('fleet.clusterTargets.clusters.byName.title') }}
      </h4>
      <ResourceLabeledSelect
        data-testid="fleet-target-cluster-name-selector"
        :class="{ 'mmt-4': !isAppco && !compact }"
        :resource-type="FLEET.CLUSTER"
        in-store="management"
        :value="selectedClusters"
        :label="t('fleet.clusterTargets.clusters.byName.label')"
        :taggable="false"
        :close-on-select="false"
        :mode="mode"
        :multiple="true"
        :placeholder="t('fleet.clusterTargets.clusters.byName.placeholder')"
        :paginated-resource-settings="paginatedClusterSettings"
        :all-resources-settings="allClusterSettings"
        @update:value="emit('select-clusters', $event)"
      />
    </div>

    <!-- Select by labels -->
    <div
      v-if="!isView || (clusterSelectors && clusterSelectors.length > 0)"
      :class="{ 'mmt-6': !isAppco }"
    >
      <component
        :is="byLabelHeading"
        :class="{ 'm-0': !isAppco }"
      >
        {{ t('fleet.clusterTargets.clusters.byLabel.title') }}
      </component>
      <div
        v-for="(selector, i) in clusterSelectors"
        :key="selector.key"
        class="match-expressions-container mmt-4"
      >
        <MatchExpressions
          :ref="(el) => setMatchExpressionRef(selector.key, el)"
          class="body"
          :value="selector"
          :mode="mode"
          :initial-empty-row="true"
          :label-key="t('fleet.clusterTargets.clusters.byLabel.labelKey')"
          :add-icon="'icon-plus'"
          :add-class="'btn-sm'"
          @update:value="emit('update-match-expressions', i, $event, selector.key)"
        />
        <RcButton
          v-if="!isView"
          size="small"
          variant="link"
          :aria-label="t('fleet.clusterTargets.clusters.byLabel.removeSelector')"
          @click="emit('remove-match-expressions', selector.key)"
        >
          <i
            class="icon icon-x"
            aria-hidden="true"
          />
        </RcButton>
      </div>
      <RcButton
        v-if="!isView"
        size="small"
        variant="secondary"
        :class="addButtonClass"
        @click="emit('add-match-expressions')"
      >
        <i class="icon icon-plus" />
        <span>{{ t('fleet.clusterTargets.clusters.byLabel.addSelector') }}</span>
      </RcButton>
    </div>

    <!-- Select by cluster groups -->
    <div :class="{ 'mmt-8': !isAppco }">
      <component
        :is="groupHeading"
        :class="{ 'm-0': !isAppco }"
      >
        {{ t('fleet.clusterTargets.clusterGroups.title') }}
      </component>
      <LabeledSelect
        data-testid="fleet-target-cluster-group-selector"
        :class="{ 'mmt-4': !isAppco }"
        :value="selectedClusterGroups"
        :label="t('fleet.clusterTargets.clusterGroups.byName.label')"
        :options="clusterGroupsOptions"
        :taggable="true"
        :close-on-select="false"
        :mode="mode"
        :multiple="true"
        :placeholder="t('fleet.clusterTargets.clusterGroups.byName.placeholder')"
        @update:value="emit('select-cluster-groups', $event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .appco-select-clusters {
    display: flex;
    flex-direction: column;
    gap: var(--gap-lg);

    h4 {
      margin: 0 0 12px 0;
    }
  }

  .match-expressions-container {
    display: flex;
    align-items: start;
    border: 1px solid var(--border);
    border-radius: 5px;

    .body {
      padding: 15px;
      width: 100%;
    }

    .btn {
      margin: 5px;
    }
  }
</style>
