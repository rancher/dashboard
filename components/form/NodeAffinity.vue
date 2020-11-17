<script>
import { _VIEW } from '@/config/query-params';
import { get, isEmpty } from '@/utils/object';
import { NODE } from '@/config/types';
import MatchExpressions from '@/components/form/MatchExpressions';
import InfoBox from '@/components/InfoBox';

export default {
  components: { MatchExpressions, InfoBox },

  props:      {
    // value should be NodeAffinity or VolumeNodeAffinity
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
    // VolumeNodeAffinity only has 'required' field
    if (this.value.required) {
      return { nodeSelectorTerms: this.value.required.nodeSelectorTerms };
    } else {
      const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = {} } = this.value;
      const { nodeSelectorTerms = [] } = requiredDuringSchedulingIgnoredDuringExecution;

      const selectorMap = {};
      const weightedSelectorMap = {};

      nodeSelectorTerms.forEach((term, i) => {
        selectorMap[i] = term;
      });
      preferredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
        weightedSelectorMap[i] = term;
      });

      return {
        selectorMap,
        weightedSelectorMap,
        weightedNodeSelectorTerms: preferredDuringSchedulingIgnoredDuringExecution,
        defaultWeight:             1
      };
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    hasWeighted() {
      return !!this.weightedNodeSelectorTerms;
    },
    node() {
      return NODE;
    },
  },

  methods: {
    update() {
      this.$nextTick(() => {
        const out = {};
        const selectors = Object.values(this.selectorMap) || [];
        const weightedSelectors = Object.values(this.weightedSelectorMap) || [];

        if (selectors.length) {
          out['requiredDuringSchedulingIgnoredDuringExecution'] = { nodeSelectorTerms: selectors };
        }
        if (weightedSelectors.length) {
          out['preferredDuringSchedulingIgnoredDuringExecution'] = weightedSelectors;
        }
        this.$emit('input', out);
      });
    },
    updateSelector(map, key, val) {
      this.$set(map, key, val);
      this.update();
    },

    get,
    isEmpty
  }

};
</script>

<template>
  <div class="row" @input="update">
    <div :class="{'col span-6':hasWeighted, 'col span-12':!hasWeighted}">
      <div v-if="!isView || Object.values(selectorMap).length " class="mb-10">
        <label><t k="workload.scheduling.affinity.requireAny" /></label>
      </div>
      <template v-for="(nodeSelectorTerm, key) in selectorMap">
        <InfoBox :key="key" class="node-selector">
          <MatchExpressions
            :key="key"
            :initial-empty-row="!isView"
            :mode="mode"
            class="col span-12"
            :type="node"
            :value="nodeSelectorTerm.matchExpressions"
            @remove="$delete(selectorMap, key)"
            @input="e=>updateSelector(selectorMap, key, {matchExpressions:e})"
          />
        </InfoBox>
      </template>
      <button v-if="!isView" type="button" class="btn role-tertiary" @click="e=>$set(selectorMap, Math.random(), {matchExpressions:[]})">
        <t k="workload.scheduling.affinity.addNodeSelector" />
      </button>
    </div>

    <div v-if="hasWeighted" class="col span-6">
      <div v-if="!isView || Object.values(weightedSelectorMap).length " class="mb-10">
        <label><t k="workload.scheduling.affinity.preferAny" /></label>
      </div>
      <template v-for="(nodeSelectorTerm, key) in weightedSelectorMap">
        <InfoBox :key="key" class="node-selector">
          <MatchExpressions
            :key="key"
            :mode="mode"
            class="col span-12"
            :initial-empty-row="!isView"
            :type="node"
            :value="get(nodeSelectorTerm, 'preference.matchExpressions')"
            :weight="nodeSelectorTerm.weight"
            @remove="$delete(weightedSelectorMap, key)"
            @input="e=>updateSelector(weightedSelectorMap, key, {preference:{matchExpressions:e}, weight:defaultWeight})"
          />
        </InfoBox>
      </template>
      <button v-if="!isView" type="button" class="btn role-tertiary" @click="e=>$set(weightedSelectorMap, Math.random(), {preference:{matchExpressions:[]}, weight:defaultWeight})">
        <t k="workload.scheduling.affinity.addNodeSelector" />
      </button>
    </div>
  </div>
</template>

<style>
  .node-selector{
    position: relative
  }
</style>
