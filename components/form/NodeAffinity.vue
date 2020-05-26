<script>
import { NODE } from '@/config/types';
import MatchExpressions from '@/components/form/MatchExpressions';

export default {
  components: { MatchExpressions },

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
    }
  },

  data() {
    // VolumeNodeAffinity only has 'required' field
    if (this.value.required) {
      return { nodeSelectorTerms: this.value.required.nodeSelectorTerms, multipleSelectors: true };
    } else {
      const { preferredDuringSchedulingIgnoredDuringExecution = [{ matchExpressions: [] }], requiredDuringSchedulingIgnoredDuringExecution = {} } = this.value;
      const { nodeSelectorTerms = [] } = requiredDuringSchedulingIgnoredDuringExecution;

      if (!nodeSelectorTerms.length) {
        nodeSelectorTerms.push({ matchExpressions: [] });
      }

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
        multipleSelectors:             false
      };
    }
  },

  computed: {
    hasWeighted() {
      return !!this.weightedNodeSelectorTerms;
    },
    node() {
      return NODE;
    },
  },

  methods: {
    update() {
      const out = {};
      const selectors = Object.values.selectorMap;
      const weightedSelectors = Object.values.weightedSelectorMap;

      if (selectors.length) {
        out['requiredDuringSchedulingIgnoredDuringExecution'] = { nodeSelectorTerms: selectors };
      }
      if (weightedSelectors.length) {
        out['preferredDuringSchedulingIgnoredDuringExecution'] = { nodeSelectorTerms: weightedSelectors };
      }

      this.$emit('input', out);
    }
  }

};
</script>

<template>
  <div class="row">
    <div :class="{'col span-6':hasWeighted, 'col span-12':!hasWeighted}">
      <slot name="title" />
      <template v-for="(nodeSelectorTerm, key) in selectorMap">
        <MatchExpressions
          :key="key"
          :mode="mode"
          class="node-selector container"
          :type="node"
          :value="nodeSelectorTerm.matchExpressions"
          @remove="$delete(selectorMap, key)"
          @input="e=>$set(selectorMap, key, {matchExpressions:e})"
        />
      </template>
      <button type="button" class="btn btn-sm role-primary" @click="e=>$set(selectorMap, Math.random(), {matchExpressions:[]})">
        Add Node Selector
      </button>
    </div>

    <div v-if="hasWeighted" class="col span-6">
      <slot name="title-weighted" />
      <template v-for="(nodeSelectorTerm, key) in weightedSelectorMap">
        <MatchExpressions
          :key="key"
          :mode="mode"
          class="node-selector container"
          :type="node"
          :value="nodeSelectorTerm.matchExpressions"
          @remove="$delete(weightedSelectorMap, key)"
          @input="e=>$set(weightedSelectorMap, key, {matchExpressions:e})"
        />
      </template>
      <button v-if="mode!=='view'" type="button" class="btn btn-sm role-primary" @click="e=>$set(weightedSelectorMap, Math.random(), {matchExpressions:[]})">
        Add Node Selector
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
