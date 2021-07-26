<script>
import DashboardOptions from '@/components/DashboardOptions';
import GrafanaDashboard from '@/components/GrafanaDashboard';
import { mapGetters } from 'vuex';
export default {
  components: { DashboardOptions, GrafanaDashboard },
  props:      {
    detailUrl: {
      type:     String,
      required: true,
    },
    summaryUrl: {
      type:     String,
      required: true,
    },
    vars: {
      type:    Object,
      default: () => ({})
    },
    graphHeight: {
      type:     String,
      required: true
    },
    hasSumarryAndDetail: {
      type:    Boolean,
      default: true,
    },
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
  <div class="dashboard-metrics">
    <div class="graph-options mb-10">
      <DashboardOptions v-model="graphOptions" :has-sumarry-and-detail="hasSumarryAndDetail" />
    </div>
    <div class="info">
      <slot />
    </div>
    <div class="graphs" :style="{height: graphHeight}">
      <GrafanaDashboard
        v-if="graphOptions.type === 'detail'"
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
        class="col span-12 summary"
        :background-color="graphBackgroundColor"
        :theme="theme"
        :refresh-rate="graphOptions.refreshRate"
        :range="graphOptions.range"
        :url="summaryUrl"
        :vars="vars"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-metrics {
  & ::v-deep {
    .external-link {
      position: absolute;
      left: 0px;
      top: -45px;
    }
    .frame {
      top: 0;
    }
  }
}
</style>
