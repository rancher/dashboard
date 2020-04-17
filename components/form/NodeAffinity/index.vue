<script>
import NodeSelectorTerm from './NodeSelectorTerm';

export default {
  components: { NodeSelectorTerm },

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
      const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = {} } = this.value;
      const { nodeSelectorTerms = [] } = requiredDuringSchedulingIgnoredDuringExecution;

      if (!nodeSelectorTerms.length) {
        nodeSelectorTerms.push({ });
      }

      return {
        nodeSelectorTerms,
        weightedNodeSelectorTerms: preferredDuringSchedulingIgnoredDuringExecution,
        multipleSelectors:             false
      };
    }
  },

  computed: {
    hasWeighted() {
      return !!this.weightedNodeSelectorTerms;
    }
  }

};
</script>

<template>
  <div class="row">
    <div :class="{'col span-6':hasWeighted, 'col span-12':!hasWeighted}">
      <slot name="title" />
      <template v-for="(nodeSelector, i) in nodeSelectorTerms">
        <div :key="i" class="row">
          <div :key="i" class="col span-12">
            <NodeSelectorTerm
              :mode="mode"
              :show-remove="false"
              class="node-selector container"
              :value="nodeSelector"
              @remove="e=>nodeSelectorTerms.splice(i, 1)"
              @input="e=>$set(nodeSelectorTerms, i, e)"
            />
          </div>
        </div>
      </template>
      <button v-if="multipleSelectors" type="button" class="btn btn-sm role-primary" @click="e=>nodeSelectorTerms.push({matchExpressions:[]})">
        Add Node Selector
      </button>
    </div>

    <div v-if="hasWeighted" class="col span-6">
      <slot name="title-weighted" />
      <template v-for="(nodeSelector, i) in weightedNodeSelectorTerms">
        <div :key="i" class="row">
          <div :key="i" class="col span-12">
            <NodeSelectorTerm
              :mode="mode"
              class="node-selector container"
              is-weighted
              :value="nodeSelector"
              @remove="e=>weightedNodeSelectorTerms.splice(i, 1)"
              @input="e=>$set(weightedNodeSelectorTerms, i, e)"
            />
          </div>
        </div>
      </template>
      <button type="button" class="btn btn-sm role-primary" @click="e=>weightedNodeSelectorTerms.push({matchExpressions:[], weight: 1})">
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
