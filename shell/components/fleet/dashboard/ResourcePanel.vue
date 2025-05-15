<script>
import { markRaw } from 'vue';
import { mapGetters } from 'vuex';
import { lcFirst } from '@shell/utils/string';
import { Chart, registerables } from 'chart.js';
import { BadgeState } from '@components/BadgeState';
import FleetUtils from '@shell/utils/fleet';

Chart.register(...registerables);

export default {

  name: 'FleetDashboardResourcePanel',

  emits: ['click:state'],

  components: { BadgeState },

  props: {
    resources: {
      type:    Array,
      default: () => ([])
    },

    workspace: {
      type:    String,
      default: ''
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

    selectedStates: {
      type:    Object,
      default: () => ({})
    },
  },

  data() {
    return {
      chartId:      `${ this.workspace }-${ this.type }`,
      chart:        null,
      chartOptions: {
        responsive: true,
        elements:   {
          arc: {
            borderWidth:      4,
            borderColor:      this.bgColor,
            hoverBorderColor: this.bgColor,
          }
        },
        plugins: {
          legend:  { display: false },
          title:   { display: false },
          tooltip: {
            yAlign:    'bottom',
            callbacks: {
              title: (ctx) => {
                const v = ctx[0];

                return `${ v?.formattedValue } ${ lcFirst(v.label) }`;
              },
              label: () => '',
            }
          }
        },
        cutout:  13,
        onHover: (event) => {
          if (this.selectable) {
            event.native.target.style.cursor = 'pointer';
          }
        },
        onClick: (_, element) => {
          const idx = element[0]?.index;

          if (idx === undefined) {
            return;
          }

          const state = this.states.find(({ index }) => idx === index);

          this.selectState(state);
        },
        animations: { borderColor: { duration: 0 } }
      },
    };
  },

  mounted() {
    if (this.showChart) {
      const container = document.getElementById(`${ this.chartId }-container`);

      const canvas = document.createElement('canvas');

      canvas.id = this.chartId;
      canvas.className = 'chart';

      container.append(canvas);

      const data = this.buildChartData();
      const options = this.chartOptions;

      const chart = new Chart(canvas, {
        type: 'doughnut',
        data,
        options,
      });

      this.chart = markRaw(chart);
    }
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),
    states() {
      const out = [];

      this.resources.forEach((obj) => {
        const {
          state,
          stateSort
        } = obj;

        const statePanel = FleetUtils.getDashboardState(obj);

        if (!out.find((s) => s.id === statePanel.id)) {
          const count = this.resources.filter((r) => FleetUtils.getDashboardStateId(r) === statePanel.id).length;

          out.push({
            ...statePanel,
            count,
            state,
            stateSort,
          });
        }
      });

      return out.sort((a, b) => a.stateSort.localeCompare(b.stateSort));
    },

    typeLabel() {
      return this.t(`typeLabel."${ this.type }"`, { count: this.resources.length });
    },
  },

  watch: {
    states: {
      handler: 'updateStates',
      deep:    true,
    },
    theme() {
      if (this.chart) {
        this.chart.update();
      }
    },
  },

  methods: {
    buildChartData() {
      const chartStates = FleetUtils.dashboardStates;

      const labels = chartStates.map(({ label }) => label);
      const backgroundColor = chartStates.map(({ color }) => color);

      const data = this.getChartStates(this.states);

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

    updateStates(value) {
      if (this.chart) {
        this.chart.data.datasets.forEach((dataset) => {
          dataset.data = this.getChartStates(value);
        });

        this.chart.update();
      }
    },

    getChartStates(states) {
      return FleetUtils.dashboardStates.map(({ id }) => states.find((s) => s.id === id)?.count || 0);
    },

    selectState(state) {
      if (!this.selectable) {
        return;
      }

      this.$emit('click:state', state.id);
    },

    onClickBadge(state) {
      this.selectState(state);
    },

    bgColor() {
      return getComputedStyle(document.body).getPropertyValue('--body-bg');
    }
  }
};
</script>

<template>
  <div class="panel">
    <div
      v-if="showChart"
      :id="chartId + '-container'"
      :data-testid="'chart-container'"
      class="panel-chart-container"
    />
    <div class="details">
      <div
        class="description"
        :data-testid="'description'"
      >
        <span class="count">{{ resources.length }}</span>
        <span class="label">{{ typeLabel }}</span>
      </div>
      <div class="states">
        <BadgeState
          v-for="(state, i) in states"
          :key="i"
          class="badge"
          :tabindex="selectable ? 0 : undefined"
          :role="selectable ? 'button' : undefined"
          :aria-label="selectable ? t('fleet.dashboard.state') + '-' + state.id : undefined"
          :class="{
            ['selectable']: selectable,
            ['selected']: selectable && selectedStates?.[state.id]
          }"
          :color="state.stateBackground"
          :label="` ${ state.count } `"
          :icon="state.icon"
          @click="onClickBadge(state)"
          @keydown.space.enter.stop.prevent="onClickBadge(state)"
        >
          <template
            v-if="selectable && selectedStates?.[state.id]"
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

    .panel-chart-container {
      padding: 3px;
      min-width: 80px;
      width: 80px;
    }

    .details {
      padding: 5px;

      .description {
        .count {
          font-size: 25px;
          font-weight: bold;
          margin-right: 4px;
        }

        .label {
          font-size: 20px;
        }
      }

      .states {
        display: flex;
        align-items: center;
        margin-top: 4px;

        .badge {
          margin: 2px 5px 2px 2px;
          border: 0;

          &.selectable {
            cursor: pointer;
          }

          &.bg-error {
            background: var(--click-badge-error-bg);
            color: var(--click-badge-error);
          }

          &.bg-warning {
            background: var(--click-badge-warning-bg);
            color: var(--click-badge-warning);
          }

          &.bg-success {
            background: var(--click-badge-success-bg);
            color: var(--click-badge-success);
          }

          &.bg-info {
            background: var(--click-badge-info-bg);
            color: var(--click-badge-info);
          }

          &.selected {
            margin: 0 5px 0 0;

            &.bg-error {
              border: 2px solid var(--click-badge-error-border);
            }

            &.bg-warning {
              border: 2px solid var(--click-badge-warning-border);
            }

            &.bg-success {
              border: 2px solid var(--click-badge-success-border);
            }

            &.bg-info {
              border: 2px solid var(--click-badge-info-border);
            }
          }
        }
      }
    }
  }

</style>
