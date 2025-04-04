<script>

export default {
  name: 'FleetApplicationClustersReady',

  components: {
  },

  props: {
    value: {
      type:    Number,
      default: 0
    },

    row: {
      type:     Object,
      required: true
    },

    col: {
      type:    Object,
      default: () => {}
    },

    rowKey: {
      type:    String,
      default: '',
    },

    getCustomDetailLink: {
      type:    Function,
      default: null
    },

  },
};
</script>

<template>
  <span
    v-if="!row.clusterInfo"
    class="text-muted"
  >&mdash;</span>
  <span
    v-else-if="row.clusterInfo.unready"
    class="text-warning"
  >{{ row.clusterInfo.ready }}/{{
    row.clusterInfo.total }}</span>
  <span
    v-else
    class="cluster-count-info"
  >
    {{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}
    <i
      v-if="!row.clusterInfo.total"
      v-clean-tooltip.bottom="parseTargetMode(row)"
      class="icon icon-warning"
    />
  </span>
</template>
