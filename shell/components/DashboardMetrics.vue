<script>
import DashboardOptions from '@shell/components/DashboardOptions';
import GrafanaDashboard from '@shell/components/GrafanaDashboard';
import GrafanaGPUDashboard from '@shell/components/GrafanaGPUDashboard';
import { mapGetters } from 'vuex';

export default {
  components: {
    DashboardOptions, GrafanaDashboard, GrafanaGPUDashboard
  },
  props: {
    detailUrl: {
      type:     String,
      required: true,
    },
    summaryUrl: {
      type:    String,
      default: '',
    },
    gpuSummaryUrl: {
      type:    String,
      default: '',
    },
    vars: {
      type:    Object,
      default: () => ({})
    },
    gpuVars: {
      type:    Object,
      default: () => ({})
    },
    // graphHeight: {
    //   type:     String,
    //   required: true
    // },
    hasSummaryAndDetail: {
      type:    Boolean,
      default: true,
    },
    hasGpu: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    return {
      graphOptions: {
        range: '5m', refreshRate: '30s', type: 'detail'
      }
    };
  },
  computed: {
    ...mapGetters(['prefs/theme']),
    graphBackgroundColor() {
      return this.theme === 'dark' ? '#2e3035' : '#f3f4f9';
    },
    theme() {
      return this['prefs/theme'];
    },
  },
};
</script>

<template>
  <div
    class="dashboard-metrics"
    :class="!hasSummaryAndDetail && 'external-link-pull-left'"
  >
    <div class="graph-options mb-10">
      <DashboardOptions
        v-model="graphOptions"
        :has-summary-and-detail="hasSummaryAndDetail"
      />
    </div>
    <div class="info">
      <slot />
    </div>
    <div class="graphs">
      <GrafanaDashboard
        v-if="graphOptions.type === 'detail'"
        key="'detail'"
        style="height: 825px;"
        class="col span-12 detail"
        :background-color="graphBackgroundColor"
        :theme="theme"
        :refresh-rate="graphOptions.refreshRate"
        :range="graphOptions.range"
        :url="detailUrl"
        :vars="vars"
      />
      <GrafanaDashboard
        v-else
        key="'summary'"
        class="col span-12 summary"
        style="height: 825px;"
        :background-color="graphBackgroundColor"
        :theme="theme"
        :refresh-rate="graphOptions.refreshRate"
        :range="graphOptions.range"
        :url="summaryUrl"
        :vars="vars"
      />
      <GrafanaGPUDashboard
        v-if="hasGpu"
        style="height: 980px;"
        class="col span-12 summary"
        :background-color="graphBackgroundColor"
        :theme="theme"
        :refresh-rate="graphOptions.refreshRate"
        :range="graphOptions.range"
        :url="gpuSummaryUrl"
        :vars="gpuVars"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-metrics {
  & ::v-deep {
    .external-link {
      position: absolute;
      left: 200px;
      top: -45px;
    }

    .frame {
      top: 0;
    }
  }
}

.dashboard-metrics.external-link-pull-left {
  & ::v-deep {
    .external-link {
      position: absolute;
      left: 10px;
      top: -47px;
    }
  }
}
</style>
