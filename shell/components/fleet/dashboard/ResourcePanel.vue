<script lang="ts">
import { markRaw, PropType } from 'vue';
import { mapGetters } from 'vuex';
import { lcFirst } from '@shell/utils/string';
import {
  Chart, ChartOptions, ChartEvent, TooltipItem, registerables
} from 'chart.js';
import { BadgeState } from '@rc/BadgeState';
import FleetUtils from '@shell/utils/fleet';
import { FleetDashboardResourceStates, FleetDashboardState } from '@shell/types/fleet';

type ChartOptionsType = ChartOptions<'doughnut'>;
type ChartType = Chart<'doughnut', any[], ChartOptionsType>;

interface DataType {
  chartId: string,
  chart: ChartType | null
}

type StatePanel = FleetDashboardState & { count: number }

Chart.register(...registerables);

export default {

  name: 'FleetDashboardResourcePanel',

  emits: ['click:state'],

  components: { BadgeState },

  props: {
    states: {
      type:    Array as PropType<FleetDashboardResourceStates[]>,
      default: () => []
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
      type:    Object as PropType<Record<string, boolean>>,
      default: () => ({})
    },
  },

  data(): DataType {
    return {
      chartId: `${ this.workspace }-${ this.type }`,
      chart:   null,
    };
  },

  mounted() {
    if (this.showChart) {
      const container = document.getElementById(`${ this.chartId }-container`);

      if (!container) {
        return;
      }

      const canvas = document.createElement('canvas');

      canvas.id = this.chartId;
      canvas.className = 'chart';

      container.append(canvas);

      const data = this.buildChartData();
      const options: ChartOptionsType = {
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
            yAlign:     'bottom',
            titleFont:  { size: 12 },
            bodyFont:   { size: 12 },
            titleAlign: 'center',
            bodyAlign:  'center',
            callbacks:  {
              title: (ctx: TooltipItem<'doughnut'>[]) => {
                const v = ctx[0];

                const value = v?.formattedValue || '';
                const label = lcFirst(v?.label || '');

                const titleLn = `${ value }${ label }`.length;

                return `${ value }${ titleLn > 7 ? '\n' : ' ' }${ label }`;
              },
              label: () => '',
            }
          }
        },
        cutout:  14,
        onHover: (event: any) => {
          if (this.selectable && event?.native?.target?.style) {
            event.native.target.style.cursor = 'pointer';
          }
        },
        onClick: (_: ChartEvent, element?: { index: number }[]) => {
          const idx = element?.[0]?.index;

          if (idx === undefined) {
            return;
          }

          const state = this.statePanels.find(({ index }) => idx === index);

          this.selectState(state);
        },
        animations: { borderColor: { duration: 0 } }
      };

      const chart = new Chart(canvas, {
        type: 'doughnut',
        data,
        options,
      }) as ChartType;

      this.chart = markRaw(chart);
    }
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    statePanels() {
      const out: StatePanel[] = [];

      this.states.forEach((state) => {
        const {
          statePanel,
          resources
        } = state;

        const exists = out.find((s) => s.id === statePanel.id);

        if (exists) {
          exists.count += resources.length;
        } else {
          out.push({
            ...statePanel,
            count: resources.length
          });
        }
      });

      return out;
    },

    count() {
      return this.statePanels.reduce((acc, state) => acc + state.count, 0);
    },

    typeLabel() {
      return this.t(`typeLabel."${ this.type }"`, { count: this.count });
    },
  },

  watch: {
    statePanels: {
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

      const data = this.getChartStates(this.statePanels);

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

    updateStates(value: StatePanel[]) {
      if (this.chart) {
        this.chart.data.datasets.forEach((dataset) => {
          dataset.data = this.getChartStates(value);
        });

        this.chart.update();
      }
    },

    getChartStates(states: StatePanel[]) {
      return FleetUtils.dashboardStates.map(({ id }) => states.find((s) => s.id === id)?.count || 0);
    },

    selectState(state?: StatePanel) {
      if (!this.selectable) {
        return;
      }

      this.$emit('click:state', state?.id);
    },

    onClickBadge(state: StatePanel) {
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
        <span class="count">{{ count }}</span>
        <span class="label">{{ typeLabel }}</span>
      </div>
      <div class="states">
        <BadgeState
          v-for="(state, i) in statePanels"
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
      min-width: 68px;
      width: 68px;
    }

    .details {
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

          &:focus-visible {
            @include focus-outline;
          }

          &.selectable {
            cursor: pointer;
          }

          &.bg-error {
            // background: var(--click-badge-error-bg); TODO revert after dashboard theme colors refactoring
            background: var(--error);
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
