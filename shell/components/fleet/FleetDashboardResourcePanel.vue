<script>
import { DoughnutChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';
import { BadgeState } from '@components/BadgeState';

Chart.register(...registerables);

export default {

  name: 'FleetDashboardResourcePanel',

  components: {
    DoughnutChart,
    BadgeState,
  },

  props: {
    chartData: {
      type:    Object,
      default: null
    },

    chartOptions: {
      type:    Object,
      default: () => ({})
    },

    description: {
      type:    Object,
      default: () => ({})
    },

    states: {
      type:    Array,
      default: () => []
    }
  },
};
</script>

<template>
  <div class="panel">
    <div
      v-if="chartData"
      class="chart"
    >
      <DoughnutChart
        :chart-data="chartData"
        :options="chartOptions"
      />
    </div>
    <div class="details">
      <div class="description">
        <span class="count">{{ description.count }}</span>
        <span class="label">{{ description.label }}</span>
      </div>
      <div class="states mt-2">
        <BadgeState
          v-for="(state, i) in states"
          :key="i"
          class="badge"
          :color="state.color"
          :label="state.label"
          :icon="state.icon"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .panel {
    display: flex;
    align-items: center;
    gap: 5px;

    .chart {
      padding: 5px;
      min-width: 80px;
      width: 80px;
    }

    .details {
      padding: 5px;

      .description {
        .count {
          font-size: 20px;
          font-weight: bold;
        }
      }

      .states {
        margin-top: 5px;

        .badge {
          margin-right: 5px;
        }
      }
    }
  }
</style>
