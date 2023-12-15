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
  <div>
    cluster sum {{ clusterLabel }}
    <FleetSummaryGraph
      :row="row"
      :clusterLabel="clusterLabel"
    />
  </div>
</template>
