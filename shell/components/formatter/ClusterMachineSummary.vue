<script>
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph.vue';

/**
 * The Machines column: the machine state graph, or a plain count when there are no states to
 * draw one from.
 *
 * The count is the part that used to live in the cluster list's own `cell:summary` slot, which
 * meant the column only worked on that page - anywhere else it drew an empty graph. A column
 * has to carry its own rendering to be worth offering on more than one list.
 */
export default {
  name: 'ClusterMachineSummary',

  components: { MachineSummaryGraph },

  props: {
    row: {
      type:     Object,
      required: true
    }
  },

  computed: {
    hasParts() {
      return !!this.row?.stateParts?.length;
    },

    nodeCount() {
      return this.row?.statusInfo?.nodeCount || 0;
    }
  }
};
</script>

<template>
  <span v-if="!hasParts">{{ nodeCount }}</span>
  <MachineSummaryGraph
    v-else
    :row="row"
  />
</template>
