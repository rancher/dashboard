<script>
import { _VIEW } from '@/config/query-params';
import { get, isEmpty } from '@/utils/object';
import { POD, NODE } from '@/config/types';
import MatchExpressions from '@/components/form/MatchExpressions';

export default {
  components: { MatchExpressions },

  props:      {
    // value should be PodAffinity
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    },

  },

  data() {
    const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = [] } = this.value;

    const selectorMap = {};
    const weightedSelectorMap = {};

    requiredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
      selectorMap[i] = term;
    });
    preferredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
      weightedSelectorMap[i] = term;
    });

    return {
      selectorMap,
      weightedSelectorMap,
      defaultWeight: 1
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    pod() {
      return POD;
    },

    node() {
      return NODE;
    }
  },

  methods: {
    update() {
      this.$nextTick(() => {
        const out = {};
        const selectors = Object.values(this.selectorMap) || [];
        const weightedSelectors = Object.values(this.weightedSelectorMap) || [];

        if (selectors.length) {
          out['requiredDuringSchedulingIgnoredDuringExecution'] = selectors;
        }
        if (weightedSelectors.length) {
          out['preferredDuringSchedulingIgnoredDuringExecution'] = weightedSelectors;
        }

        this.$emit('input', out);
      });
    },

    addSelector() {
      const neu = { namespaces: [], labelSelector: { matchExpressions: [] } };
      const key = Math.random();

      this.$set(this.selectorMap, key, neu);
    },

    addWeightedSelector() {
      const neu = { weight: this.defaultWeight, podAffinityTerm: { namespaces: [], labelSelector: { matchExpressions: [] } } };
      const key = Math.random();

      this.$set(this.weightedSelectorMap, key, neu);
    },
    isEmpty,
    get,
  }

};
</script>

<template>
  <div :style="{'width':'100%'}" class="row" @input="update">
    <div class="col span-6">
      <div class="mb-10">
        <t k="workload.scheduling.affinity.requireAny" />
      </div>
      <div v-if="isView && isEmpty(selectorMap)">
        <MatchExpressions
          :mode="mode"
          class="node-selector col span-12"
          :type="node"
        />
      </div>
      <template v-for="(nodeSelectorTerm, key) in selectorMap">
        <div :key="key" class="row">
          <MatchExpressions
            :key="key"
            :initial-empty-row="!isView"
            :mode="mode"
            class="node-selector col span-12"
            :type="pod"
            :namespaces.sync="nodeSelectorTerm.namespaces"
            :value="get(nodeSelectorTerm, 'labelSelector.matchExpressions')"
            @remove="$delete(selectorMap, key)"
            @input="e=>$set(selectorMap[key].labelSelector, 'matchExpressions', e )"
          />
        </div>
      </template>
      <button v-if="!isView && isEmpty(selectorMap)" type="button" class="btn btn-sm role-primary" @click="addSelector">
        Add Pod Selector
      </button>
    </div>

    <div class="col span-6">
      <div class="mb-10">
        <t k="workload.scheduling.affinity.preferAny" />
      </div>
      <div v-if="isView && isEmpty(weightedSelectorMap)">
        <MatchExpressions
          :mode="mode"
          class="node-selector col span-12"
          :type="node"
        />
      </div>
      <template v-for="(nodeSelectorTerm, key) in weightedSelectorMap">
        <div :key="key" class="row">
          <MatchExpressions
            :key="key"
            :mode="mode"
            class="node-selector col span-12"
            :initial-empty-row="!isView"
            :type="pod"
            :namespaces.sync="nodeSelectorTerm.podAffinityTerm.namespaces"
            :value="get(nodeSelectorTerm, 'podAffinityTerm.labelSelector.matchExpressions')"
            :weight="get(nodeSelectorTerm, 'weight')"
            @remove="$delete(weightedSelectorMap, key)"
            @input="e=>$set(weightedSelectorMap[key].podAffinityTerm.labelSelector, 'matchExpressions', e)"
          />
        </div>
      </template>
      <button v-if="!isView" type="button" class="btn btn-sm role-primary" @click="addWeightedSelector">
        Add Pod Selector
      </button>
    </div>
  </div>
</template>

<style>
  .node-selector {
    padding: 10px;
    background-color: var(--body-bg);
  }
</style>
