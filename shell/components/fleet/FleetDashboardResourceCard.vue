<script>
import FleetSummaryGraph from '@shell/components/formatter/FleetSummaryGraph';

export default {

  name: 'FleetDashboardResourceCard',

  components: { FleetSummaryGraph },

  props: {
    value: {
      type:     Object,
      required: true
    },
  },
};
</script>

<template>
  <div class="panel">
    <div class="title">
      <i :class="value.fleetIcon" />
      <span>{{ value.nameDisplay }}</span>
    </div>
    <div class="body">
      <div class="resource-chart">
        <FleetSummaryGraph :row="value" />
      </div>
      <div class="resource-counter">
        COUNTER
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .panel {
    border: 1px solid var(--modal-border);
    border-radius: 10px;
    padding: 10px;
  }
</style>
