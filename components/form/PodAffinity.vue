<script>
import { _VIEW } from '@/config/query-params';
import { get, isEmpty, cleanUp } from '@/utils/object';
import { POD, NODE } from '@/config/types';
import MatchExpressions from '@/components/form/MatchExpressions';
import InfoBox from '@/components/InfoBox';

export default {
  components: { MatchExpressions, InfoBox },

  props:      {
    // value should be PodAffinity / PodAntiAffinity
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    }
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
        this.$emit('input', cleanUp(out));
      });
    },

    addSelector() {
      const neu = {
        namespaces: [], labelSelector: { matchExpressions: [] }, topologyKey: ''
      };
      const key = Math.random();

      this.$set(this.selectorMap, key, neu);
    },

    addWeightedSelector() {
      const neu = {
        weight:          this.defaultWeight,
        podAffinityTerm: {
          namespaces: [], labelSelector: { matchExpressions: [] }, topologyKey: ''
        }
      };
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
      <div v-if="!isView || Object.values(selectorMap).length " class="mb-10">
        <label><t k="workload.scheduling.affinity.requireAny" /></label>
      </div>
      <template v-for="(nodeSelectorTerm, key) in selectorMap">
        <InfoBox :key="key" class="node-selector">
          <MatchExpressions
            :key="key"
            :mode="mode"
            class=" col span-12"
            :type="pod"
            :namespaces.sync="nodeSelectorTerm.namespaces"
            :topology-key.sync="nodeSelectorTerm.topologyKey"
            :value="get(nodeSelectorTerm, 'labelSelector.matchExpressions')"
            @remove="$delete(selectorMap, key)"
            @input="e=>$set(selectorMap[key], 'labelSelector', {matchExpressions:e})"
          />
        </InfoBox>
      </template>
      <button v-if="!isView" type="button" class="btn role-tertiary" @click="addSelector">
        {{ t('podAffinity.addLabel') }}
      </button>
    </div>

    <div class="col span-6">
      <div v-if="!isView || Object.values(weightedSelectorMap).length " class="mb-10">
        <label><t k="workload.scheduling.affinity.preferAny" /></label>
      </div>
      <template v-for="(nodeSelectorTerm, key) in weightedSelectorMap">
        <InfoBox :key="key" class="node-selector">
          <MatchExpressions
            :key="key"
            :mode="mode"
            class=" col span-12"
            :type="pod"
            :namespaces.sync="nodeSelectorTerm.podAffinityTerm.namespaces"
            :topology-key.sync="nodeSelectorTerm.podAffinityTerm.topologyKey"
            :value="get(nodeSelectorTerm, 'podAffinityTerm.labelSelector.matchExpressions')"
            :weight="get(nodeSelectorTerm, 'weight')"
            @remove="$delete(weightedSelectorMap, key)"
            @input="e=>$set(weightedSelectorMap[key].podAffinityTerm, 'labelSelector', {matchExpressions:e})"
          />
        </InfoBox>
      </template>
      <button v-if="!isView" type="button" class="btn role-tertiary" @click="addWeightedSelector">
        {{ t('podAffinity.addLabel') }}
      </button>
    </div>
  </div>
</template>

<style>
.node-selector{
  position: relative;
}
</style>
