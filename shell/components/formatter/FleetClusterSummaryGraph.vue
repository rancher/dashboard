<script>
import FleetSummaryGraph from '@shell/components/formatter/FleetSummaryGraph';

export default {
  name:       'FleetClusterSummaryGraph',
  components: { FleetSummaryGraph },

  props: {
    row: {
      type:     Object,
      required: true
    },

    clusterId: {
      type:     String,
      required: true
    }
  },
};
</script>

<template>
  <FleetSummaryGraph
    :row="row"
    :clusterId="clusterId"
  />
</template>
