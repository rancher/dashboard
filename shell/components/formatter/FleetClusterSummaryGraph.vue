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

    clusterLabel: {
      type:     String,
      required: true
    }
  },
};
</script>

<template>
  <FleetSummaryGraph
    :row="row"
    :clusterLabel="clusterLabel"
  />
</template>
