<script>
import { _VIEW } from '@/config/query-params';
import { get } from '@/utils/object';
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
    get,
  }

};
</script>

<template>
  <div class="row" @input="update">
    <div :class="{'col span-6':hasWeighted, 'col span-12':!hasWeighted}">
      <slot name="title" />
      <template v-for="(nodeSelectorTerm, key) in selectorMap">
        <div :key="key" class="row">
          <MatchExpressions
            :key="key"
            :initial-empty-row="!isView"
            :mode="mode"
            class="node-selector col span-12"
            :type="node"
            :value="nodeSelectorTerm.matchExpressions"
            @remove="$delete(selectorMap, key)"
            @input="e=>$set(selectorMap, key, {matchExpressions:e})"
          />
        </div>
      </template>
      <button v-if="!isView" type="button" class="btn btn-sm role-primary" @click="e=>$set(selectorMap, Math.random(), {matchExpressions:[]})">
        Add Node Selector
      </button>
    </div>

    <div v-if="hasWeighted" class="col span-6">
      <slot name="title-weighted" />
      <template v-for="(nodeSelectorTerm, key) in weightedSelectorMap">
        <div :key="key" class="row">
          <MatchExpressions
            :key="key"
            :mode="mode"
            class="node-selector col span-12"
            :initial-empty-row="!isView"
            :type="node"
            :value="get(nodeSelectorTerm, 'preference.matchExpressions')"
            @remove="$delete(weightedSelectorMap, key)"
            @input="e=>$set(weightedSelectorMap, key, {preference:{matchExpressions:e}, weight:1})"
          />
        </div>
      </template>
      <button v-if="!isView" type="button" class="btn btn-sm role-primary" @click="e=>$set(weightedSelectorMap, Math.random(), {preference:{matchExpressions:[]}, weight:1})">
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
