<script lang="ts">
import { PropType } from 'vue';
import { isEmpty } from 'lodash';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { HARVESTER_CONTAINER } from '@shell/store/features';
import { FLEET } from '@shell/config/types';
import FleetUtils from '@shell/utils/fleet';
import { Expression, Selector, Target, TargetMode } from '@shell/types/fleet';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { Banner } from '@components/Banner';
import { RcSection } from '@components/RcSection';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import TargetsList from '@shell/components/fleet/FleetClusterTargets/TargetsList.vue';
import ClusterSelectionFields from '@shell/components/fleet/FleetClusterTargets/ClusterSelectionFields.vue';

export interface Cluster {
  name: string,
  nameDisplay: string,
  detailLocation: object,
}

interface FleetResource {
  name: string,
  nameDisplay: string,
  metadata: {
    name: string,
    namespace: string,
  },
}

interface DataType {
  targetMode: TargetMode,
  allClusters: FleetResource[],
  allClusterGroups: FleetResource[],
  selectedClusters: string[],
  selectedClusterGroups: string[],
  clusterSelectors: Selector[],
  key: number,
  clustersExpanded: boolean,
  areHarvesterHostsVisible: boolean,
}

const excludeHarvesterRule = FleetUtils.Application.excludeHarvesterRule;
const includeAllWorkgroupRule = FleetUtils.Application.includeAllWorkgroupRule;

export default {

  name: 'FleetClusterTargets',

  emits: ['update:value', 'created'],

  components: {
    Banner,
    ClusterSelectionFields,
    RadioGroup,
    RcSection,
    TargetsList,
  },

  props: {
    targets: {
      type:    Array as PropType<Target[]>,
      default: () => [],
    },

    matching: {
      type:    Array as PropType<Cluster[]>,
      default: () => [],
    },

    namespace: {
      type:    String,
      default: ''
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    created: {
      type:    String as PropType<TargetMode>,
      default: '',
    },

    compact: {
      type:    Boolean,
      default: false,
    },

  },

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      allClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER
      },
      allClusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      },
    }, this.$store) as { allClusters: FleetResource[], allClusterGroups: FleetResource[] };

    this.allClusters = hash.allClusters || [];
    this.allClusterGroups = hash.allClusterGroups || [];
  },

  data(): DataType {
    return {
      targetMode:               'all',
      allClusters:              [],
      allClusterGroups:         [],
      selectedClusters:         [],
      selectedClusterGroups:    [],
      clusterSelectors:         [],
      key:                      0, // Generates a unique key to handle Targets
      clustersExpanded:         true,
      /**
       * Are host harvesters treated as normal clusters... or are they hidden
       */
      areHarvesterHostsVisible: false,
    };
  },

  mounted() {
    this.areHarvesterHostsVisible = this.$store.getters['features/get'](HARVESTER_CONTAINER);

    this.fromTargets();

    if (this.mode === _CREATE) {
      // Restore the targetMode from parent component; this is the case of edit targets in CREATE mode, go to YAML editor and come back to the form
      this.targetMode = this.created || 'all';
      this.update();
    } else {
      this.targetMode = FleetUtils.Application.getTargetMode(this.targets || [], this.namespace, this.areHarvesterHostsVisible);
      // We only want to update the information from the new target mode if it is EDIT, if CREATE, if VIEW we want to keep as it is
      if (this.mode === _EDIT) {
        this.update();
      }
    }
  },

  watch: {
    namespace() {
      if (this.mode === _CREATE) {
        this.reset();
      }

      if (this.mode !== _VIEW) {
        this.update();
      }
    },

    allClusters(clusters: FleetResource[]) {
      if (clusters.length) {
        // Resolve metadata.name values to nameDisplay for UI display
        this.selectedClusters = this.selectedClusters.map(
          (name) => this.resolveClusterDisplayName(name)
        );
      }
    },
  },

  computed: {
    targetModeOptions(): { label: string, value: TargetMode }[] {
      if (this.namespace === 'fleet-local') {
        return [{
          label: this.t('fleet.clusterTargets.targetMode.local'),
          value: 'local'
        }];
      }

      const allLabel = this.compact ? this.t('fleet.clusterTargets.targetMode.allCompact', { namespace: this.namespace, count: this.clustersOptions.length }, { raw: true }) : this.t('fleet.clusterTargets.targetMode.all');

      const out: { label: string, value: TargetMode }[] = [
        {
          label: allLabel,
          value: 'all',
        },
        {
          label: this.t('fleet.clusterTargets.targetMode.none'),
          value: 'none'
        },
      ];

      if (this.clustersOptions.length) {
        out.push({
          label: this.t('fleet.clusterTargets.targetMode.clusters'),
          value: 'clusters'
        });
      }

      return out;
    },

    clustersOptions() {
      return this.allClusters
        .filter((x) => x.metadata.namespace === this.namespace && (this.areHarvesterHostsVisible || !isHarvesterCluster(x) || this.selectedClusters.includes(x.name)))
        .map((x) => ({
          label:    x.nameDisplay,
          value:    x.nameDisplay,
          disabled: !this.areHarvesterHostsVisible && isHarvesterCluster(x)
        }));
    },

    clusterGroupsOptions() {
      return this.allClusterGroups
        .filter((x) => x.metadata.namespace === this.namespace)
        .map((x) => {
          return { label: x.nameDisplay, value: x.metadata.name };
        });
    },

    isLocal() {
      return this.namespace === 'fleet-local';
    },

    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    selectTargetMode(value: TargetMode) {
      this.targetMode = value;

      // Save the current targetMode in parent component
      this.$emit('created', this.targetMode);

      this.update();
    },

    selectClusters(list: string[]) {
      this.selectedClusters = list;

      this.update();
    },

    selectClusterGroups(list: string[]) {
      this.selectedClusterGroups = list;

      this.update();
    },

    addMatchExpressions() {
      const neu = { key: this.key++ };

      this.clusterSelectors.push(neu);

      (this.$refs.selectionFields as any)?.focusMatchExpression(neu.key);

      this.update();
    },

    updateMatchExpressions(index: number, value: Selector, key?: number) {
      this.clusterSelectors[index] = { ...value, key };

      this.update();
    },

    removeMatchExpressions(key?: number) {
      this.clusterSelectors = this.clusterSelectors.filter((f) => f.key !== key);

      this.update();
    },

    update() {
      const targets = this.toTargets();

      this.$emit('update:value', targets);
    },

    fromTargets() {
      if (!this.targets?.length) {
        return;
      }

      for (const target of this.targets) {
        const {
          clusterName,
          clusterSelector,
          clusterGroup,
          clusterGroupSelector,
        } = target;

        // If clusterGroupSelector are defined, targets are marked as complex and won't handle by the UI
        if (clusterGroupSelector) {
          return;
        }

        if (clusterGroup) {
          this.selectedClusterGroups.push(clusterGroup);
        }

        if (clusterName) {
          this.selectedClusters.push(clusterName);
        }

        if (!isEmpty(clusterSelector)) {
          const neu = {
            key:              this.key++,
            matchLabels:      clusterSelector.matchLabels,
            matchExpressions: clusterSelector.matchExpressions?.filter((f) => f.key !== excludeHarvesterRule.clusterSelector.matchExpressions[0].key)
          };

          if (neu.matchLabels || neu.matchExpressions?.length) {
            this.clusterSelectors.push(neu);
          }
        }
      }
    },

    toTargets(): Target[] | undefined {
      switch (this.targetMode) {
      case 'none': // No clusters
        return undefined;
      case 'all': // All clusters in workspace
        if (this.areHarvesterHostsVisible) {
          // set it to empty to clear any previous and hidden harvester omission
          return [includeAllWorkgroupRule];
        }

        return [excludeHarvesterRule];
      case 'clusters': // 'Manually selected clusters'
        return this.normalizeTargets(this.selectedClusters, this.clusterSelectors, this.selectedClusterGroups);
      case 'advanced': // no longer in use?
      case 'local': // only option for fleet-local workspace
        return this.targets;
      }
    },

    normalizeTargets(selected: string[], clusterMatchExpressions: Selector[], selectedClusterGroups: string[]): Target[] | undefined {
      const targets: Target[] = [];

      // Select by name
      selected.forEach((clusterName) => {
        targets.push({ clusterName });
      });

      // Select by labels
      clusterMatchExpressions.forEach((elem) => {
        const { matchLabels: labels, matchExpressions: expressions } = elem || {};

        if (labels || expressions) {
          const matchLabels = Object.keys(labels || {}).reduce((acc, key) => {
            if (key && labels) {
              return {
                ...acc,
                [key]: labels[key],
              };
            }

            return acc;
          }, {});

          const matchExpressions = (expressions || []).reduce((acc, expression) => {
            // Do not display Harvester-exclude rule
            if (expression.key && expression.key !== excludeHarvesterRule.clusterSelector.matchExpressions[0].key) {
              return [
                ...acc,
                expression
              ];
            }

            return acc;
          }, [] as Expression[]);

          const clusterSelector: Selector = {};

          if (!isEmpty(matchLabels)) {
            clusterSelector.matchLabels = matchLabels;
          }

          if (matchExpressions.length) {
            clusterSelector.matchExpressions = matchExpressions;
          }

          if (!isEmpty(clusterSelector)) {
            targets.push({ clusterSelector });
          }
        }
      });

      // Select by cluster group
      selectedClusterGroups.forEach((clusterGroup) => {
        targets.push({ clusterGroup });
      });

      if (targets.length) {
        return targets;
      }

      return undefined;
    },

    resolveClusterDisplayName(name: string): string {
      const cluster = this.allClusters.find(
        (c: FleetResource) => c.metadata.namespace === this.namespace && c.metadata.name === name
      );

      return cluster ? cluster.nameDisplay : name;
    },

    reset() {
      this.targetMode = 'all';
      this.selectedClusters = [];
      this.selectedClusterGroups = [];
      this.clusterSelectors = [];
    }
  },
};
</script>

<template>
  <div :class="compact ? 'gap-md' : 'gap-20'">
    <div
      v-if="targetMode !== 'advanced'"
      class="row"
    >
      <RadioGroup
        name="targetMode"
        data-testid="fleet-target-cluster-radio-button"
        :value="isLocal ? 'local' : targetMode"
        :mode="mode"
        :options="targetModeOptions"
        :disabled="isView"
        :use-body-text-color="compact"
        @update:value="selectTargetMode"
      />
    </div>

    <Banner
      v-if="targetMode === 'advanced'"
      class="row"
      color="warning"
      :label="t('fleet.clusterTargets.advancedConfigs')"
    />

    <!-- AppCo: RcSection layout -->
    <div
      v-if="targetMode === 'clusters' && compact && !isView"
      class="row"
    >
      <div class="col span-12 content-group">
        <RcSection
          v-model:expanded="clustersExpanded"
          :title="t('fleet.clusterTargets.clusters.title')"
          mode="with-header"
          type="secondary"
          expandable
          data-testid="fleet-target-clusters-section"
        >
          <template
            v-if="!clustersExpanded"
            #badges
          >
            <span
              class="cluster-count-badge"
              :aria-label="t('fleet.clusterTargets.rules.matching.title', { n: matching.length })"
            >
              {{ t('fleet.clusterTargets.rules.matching.title', { n: matching.length }) }}
            </span>
          </template>
          <div class="row">
            <div class="col span-8">
              <ClusterSelectionFields
                ref="selectionFields"
                variant="appco"
                :selected-clusters="selectedClusters"
                :selected-cluster-groups="selectedClusterGroups"
                :cluster-selectors="clusterSelectors"
                :clusters-options="clustersOptions"
                :cluster-groups-options="clusterGroupsOptions"
                :mode="mode"
                :is-view="isView"
                :compact="compact"
                @select-clusters="selectClusters"
                @select-cluster-groups="selectClusterGroups"
                @add-match-expressions="addMatchExpressions"
                @update-match-expressions="updateMatchExpressions"
                @remove-match-expressions="removeMatchExpressions"
              />
            </div>
            <div class="col span-4 targets-col">
              <TargetsList
                class="target-list"
                :clusters="matching"
                :compact="compact"
                :empty-label="t('fleet.clusterTargets.rules.matching.placeholder')"
              />
            </div>
          </div>
        </RcSection>
      </div>
    </div>

    <!-- Default: original layout -->
    <div
      v-if="targetMode === 'clusters' && (!compact || isView)"
      class="row"
    >
      <div class="col span-8">
        <h3
          v-if="!compact"
          class="m-0"
        >
          {{ t('fleet.clusterTargets.clusters.title') }}
        </h3>
        <ClusterSelectionFields
          ref="selectionFields"
          variant="default"
          :selected-clusters="selectedClusters"
          :selected-cluster-groups="selectedClusterGroups"
          :cluster-selectors="clusterSelectors"
          :clusters-options="clustersOptions"
          :cluster-groups-options="clusterGroupsOptions"
          :mode="mode"
          :is-view="isView"
          :compact="compact"
          @select-clusters="selectClusters"
          @select-cluster-groups="selectClusterGroups"
          @add-match-expressions="addMatchExpressions"
          @update-match-expressions="updateMatchExpressions"
          @remove-match-expressions="removeMatchExpressions"
        />
      </div>
      <div class="col span-4">
        <TargetsList
          class="target-list"
          :clusters="matching"
          :empty-label="t('fleet.clusterTargets.rules.matching.placeholder')"
        />
      </div>
    </div>

    <!-- All mode: compact intentionally omits the target list since the parent handles cluster visibility -->
    <div
      v-if="targetMode === 'all' && !isLocal && !compact"
      class="row"
    >
      <div class="col span-6">
        <TargetsList
          class="target-list"
          :clusters="matching"
          :compact="compact"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .content-group {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  .gap-md {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }
  .gap-20 {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .targets-col {
    position: relative;
  }

  .targets-col .target-list {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .cluster-count-badge {
    display: inline-flex;
    padding: 2px 8px;
    align-items: center;
    border-radius: 30px;
    border: 1px solid var(--rc-inactive-border);
    background: var(--body-bg);
    font-size: 12px;
    line-height: 17px;
    color: var(--body-text);
  }
</style>
