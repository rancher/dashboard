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
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import MatchExpressions from '@shell/components/form/MatchExpressions.vue';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import TargetsList from '@shell/components/fleet/FleetClusterTargets/TargetsList.vue';

export interface Cluster {
  name: string,
  nameDisplay: string
}

interface DataType {
  targetMode: TargetMode,
  allClusters: any[],
  selectedClusters: string[],
  clusterSelectors: Selector[],
  key: number,
  areHarvesterHostsVisible: boolean,
}

const excludeHarvesterRule = FleetUtils.Application.excludeHarvesterRule;
const includeAllWorkgroupRule = FleetUtils.Application.includeAllWorkgroupRule;

export default {

  name: 'FleetClusterTargets',

  emits: ['update:value', 'created'],

  components: {
    Banner,
    LabeledSelect,
    MatchExpressions,
    RadioGroup,
    RcButton,
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
  },

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      allClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER
      }
    }, this.$store) as { allClusters: any[] };

    this.allClusters = hash.allClusters || [];
  },

  data(): DataType {
    return {
      targetMode:               'all',
      allClusters:              [],
      selectedClusters:         [],
      clusterSelectors:         [],
      key:                      0, // Generates a unique key to handle Targets
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
      this.update();

      // Restore the targetMode from parent component; this is the case of edit targets in CREATE mode, go to YAML editor and come back to the form
      this.targetMode = this.created || 'all';
    } else {
      this.targetMode = FleetUtils.Application.getTargetMode(this.targets || [], this.namespace, this.areHarvesterHostsVisible);
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
  },

  computed: {
    targetModeOptions(): { label: string, value: TargetMode }[] {
      if (this.namespace === 'fleet-local') {
        return [{
          label: 'local cluster',
          value: 'local'
        }];
      }

      const out: { label: string, value: TargetMode }[] = [
        {
          label: 'All Clusters in the workspace',
          value: 'all',
        },
        {
          label: 'No clusters',
          value: 'none'
        },
      ];

      if (this.clustersOptions.length) {
        out.push({
          label: 'Manually selected clusters',
          value: 'clusters'
        });
      }

      return out;
    },

    clustersOptions() {
      return this.allClusters
        .filter((x) => x.metadata.namespace === this.namespace && (this.areHarvesterHostsVisible || !isHarvesterCluster(x)))
        .map((x) => ({ label: x.nameDisplay, value: x.metadata.name }));
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

    addMatchExpressions() {
      const neu = { key: this.key++ };

      this.clusterSelectors.push(neu);

      // Focus first element in MatchExpression
      this.$nextTick(() => {
        const matchExpression = (this.$refs[`match-expression-${ neu.key }`] as HTMLElement[])?.[0];

        matchExpression?.focus();
      });

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

        // If clusterGroup or clusterGroupSelector are defined, targets are marked as complex and won't handle by the UI
        if (clusterGroup || clusterGroupSelector) {
          return;
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
        return this.normalizeTargets(this.selectedClusters, this.clusterSelectors);
      case 'advanced': // no longer in use?
      case 'local': // only option for fleet-local workspace
        return this.targets;
      }
    },

    normalizeTargets(selected: string[], clusterMatchExpressions: Selector[]) {
      const targets: Target[] = [];

      selected.forEach((clusterName) => {
        targets.push({ clusterName });
      });

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

      if (targets.length) {
        return targets;
      }

      return undefined;
    },

    reset() {
      this.targetMode = 'all';
      this.selectedClusters = [];
      this.clusterSelectors = [];
    }
  },
};
</script>

<template>
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
      @update:value="selectTargetMode"
    />
  </div>

  <Banner
    v-if="targetMode === 'advanced'"
    class="row"
    color="warning"
    :label="t('fleet.clusterTargets.advancedConfigs')"
  />

  <div
    v-if="targetMode === 'clusters'"
    class="row mt-20"
  >
    <div class="col span-9">
      <h3 class="m-0">
        {{ t('fleet.clusterTargets.title') }}
      </h3>
      <LabeledSelect
        data-testid="fleet-target-cluster-name-selector"
        class="mmt-4"
        :value="selectedClusters"
        :label="t('fleet.clusterTargets.label')"
        :options="clustersOptions"
        :taggable="true"
        :close-on-select="false"
        :mode="mode"
        :multiple="true"
        :placeholder="t('fleet.clusterTargets.placeholders.selectMultiple')"
        @update:value="selectClusters"
      />
      <div class="mmt-8">
        <h3 class="m-0">
          {{ t('fleet.clusterTargets.rules.title') }}
        </h3>
        <div
          v-for="(selector, i) in clusterSelectors"
          :key="selector.key"
          class="match-expressions-container mmt-4"
        >
          <MatchExpressions
            :ref="`match-expression-${ selector.key }`"
            class="body"
            :value="selector"
            :mode="mode"
            :initial-empty-row="true"
            :label-key="t('fleet.clusterTargets.rules.labelKey')"
            :add-icon="'icon-plus'"
            :add-class="'btn-sm'"
            @update:value="updateMatchExpressions(i, $event, selector.key)"
          />
          <RcButton
            small
            link
            @click="removeMatchExpressions(selector.key)"
          >
            <i class="icon icon-x" />
          </RcButton>
        </div>
        <RcButton
          small
          secondary
          class="mmt-6"
          @click="addMatchExpressions"
        >
          <i class="icon icon-plus" />
          <span>{{ t('fleet.clusterTargets.rules.addSelector') }}</span>
        </RcButton>
      </div>
    </div>
    <div class="col span-3">
      <TargetsList
        class="target-list"
        :clusters="matching"
        :empty-label="t('fleet.clusterTargets.rules.matching.placeholder')"
      />
    </div>
  </div>

  <div
    v-if="targetMode === 'all' && !isLocal"
    class="row"
  >
    <div class="col span-6">
      <TargetsList
        class="target-list mt-20"
        :clusters="matching"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

  .target-list {
    max-height: 250px;
  }
</style>
