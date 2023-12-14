<script>
import FleetSummaryGraph from '@shell/components/formatter/FleetSummaryGraph';
import { ucFirst } from '@shell/utils/string';
import { colorForState, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import { sortBy } from '@shell/utils/sort';

export default {
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
    <FleetSummaryGraph :row="row" :clusterLabel="clusterLabel" />
  </div>
</template>
