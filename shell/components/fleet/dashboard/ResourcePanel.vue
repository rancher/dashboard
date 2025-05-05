<script>
import { DoughnutChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';
import { BadgeState } from '@components/BadgeState';
import FleetUtils from '@shell/utils/fleet';

Chart.register(...registerables);

export default {

  name: 'FleetDashboardResourcePanel',

  emits: ['select:states'],

  components: {
    DoughnutChart,
    BadgeState,
  },

  props: {
    resources: {
      type:    Array,
      default: () => ([])
    },

    type: {
      type:    String,
      default: ''
    },

    showChart: {
      type:    Boolean,
      default: true
    },

    selectable: {
      type:    Boolean,
      default: true
    },
  },

  data() {
    return {
      chartOptions: {
        plugins: {
          legend: { display: false },
          title:  { display: false },
        },
        // scales: {
        //   myScale: {
        //     type: "logarithmic",
        //     position: 'left',
        //   },
        // },
        // onClick: (_, value) => {
        //   const index = value[0]?.index;

        //   const id = panelStates[index]?.id;

        //   this.filterRepos(id);
        // }
      },
      selectedStates: {},
    };
  },

  computed: {
    states() {
      const out = [];

      this.resources.forEach((obj) => {
        const {
          state,
          stateSort
        } = obj;

        const id = FleetUtils.getDashboardStateId(state);

        if (!out.find((s) => s.id === id)) {
          const count = this.resources.filter((f) => FleetUtils.getDashboardStateId(f.state) === id).length;
          const panelState = FleetUtils.getDashboardState(id);

          out.push({
            ...panelState,
            count,
            state,
            stateSort,
          });
        }
      });

      return out.sort((a, b) => a.stateSort.localeCompare(b.stateSort));
    },

    chartData() {
      const chartStates = FleetUtils.dashboardStates;

      const labels = chartStates.map(({ label }) => label);
      const backgroundColor = chartStates.map(({ color }) => color);

      const data = chartStates.map(({ id }) => this.states.find((s) => s.id === id)?.count || 0);

      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
          },
        ],
      };
    },

    typeLabel() {
      return this.t(`typeLabel."${ this.type }"`, { count: this.resources.length });
    },
  },

  methods: {
    onClickBadge(state) {
      if (!this.selectable) {
        return;
      }

      this.selectedStates[state.id] = !this.selectedStates[state.id];

      const selected = Object.keys(this.selectedStates).filter((k) => this.selectedStates[k]);

      this.$emit('select:states', selected);
    }
  }
};
</script>

<template>
  <div class="panel">
    <div
      v-if="showChart"
      class="chart"
    >
      <DoughnutChart
        :chart-data="chartData"
        :options="chartOptions"
      />
    </div>
    <div class="details">
      <div class="description">
        <span class="count">{{ resources.length }}</span>
        <span class="label">{{ typeLabel }}</span>
      </div>
      <div class="states mt-5">
        <BadgeState
          v-for="(state, i) in states"
          :key="i"
          class="badge"
          :class="{
            ['selectable']: selectable,
            ['selected']: selectedStates[state.id]
          }"
          :color="state.stateBackground"
          :label="` ${ state.count } `"
          :icon="state.icon"
          @click="onClickBadge(state)"
        >
          <template
            v-if="selectedStates[state.id]"
            #content-right
          >
            <i class="icon icon-close ml-5" />
          </template>
        </BadgeState>
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
        display: flex;
        align-items: center;

        .badge {
          margin: 0 5px 0 0;

          &.selectable {
            cursor: pointer;
          }

          &.selected {
            &.bg-error {
              background: var(--error);
              color: var(--primary-text);
            }

            &.bg-warning {
              background: var(--warning);
              color: var(--warning-text);
            }

            &.bg-info {
              background: var(--info);
              color: var(--primary-text);
            }

            &.bg-success {
              background: var(--success);
              color: var(--primary-text);
            }
          }

          &.bg-error {
            background: transparent;
            color: var(--error);
          }

          &.bg-warning {
            background: transparent;
            color: var(--warning);
          }

          &.bg-info {
            background: transparent;
            color: var(--info);
          }
        }
      }
    }
  }

</style>
