<script>
import Loading from '@shell/components/Loading';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import TypeDescription from '@shell/components/TypeDescription';

import ResourceTable from '@shell/components/ResourceTable';
import { MONITORING } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
export default {
  components: {
    Loading, Tabbed, Tab, ResourceTable, TypeDescription
  },

  async fetch() {
    this.podMonitorSchema = this.$store.getters['cluster/schemaFor'](MONITORING.PODMONITOR);
    this.serviceMonitorSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SERVICEMONITOR);

    const hash = await allHash( {
      podMonitors:     this.$store.dispatch('cluster/findAll', { type: MONITORING.PODMONITOR } ),
      serviceMonitors: this.$store.dispatch('cluster/findAll', { type: MONITORING.SERVICEMONITOR } )
    });

    this.podMonitors = hash.podMonitors;
    this.serviceMonitors = hash.serviceMonitors;
  },

  data() {
    const initTab = this.$route.query.resource || MONITORING.SPOOFED.PODMONITOR;

    return {
      podMonitors: [], serviceMonitors: [], podMonitorSchema: null, serviceMonitorSchema: null, initTab
    };
  },

  computed: {
    createRoute() {
      const activeResource = this.$refs?.tabs?.activeTabName || this.routeSchema.id;

      return {
        name:   'c-cluster-monitoring-monitor-create',
        params: { cluster: this.$route.params.cluster },
        query:  { resource: activeResource }
      };
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row header mb-40">
      <h1>  {{ t('monitoring.monitors') }}</h1>
      <div>
        <button
          class="btn btn-lg role-primary float right"
          @click="$router.push(createRoute)"
        >
          {{ t('resourceList.head.createFromYaml') }}
        </button>
      </div>
    </div>
    <Tabbed
      ref="tabs"
      :default-tab="initTab"
    >
      <Tab
        :name="podMonitorSchema.id"
        :label="$store.getters['type-map/labelFor'](podMonitorSchema, 2)"
      >
        <TypeDescription :resource="podMonitorSchema.id" />
        <ResourceTable
          :schema="podMonitorSchema"
          :rows="podMonitors"
        />
      </Tab>
      <Tab
        :name="serviceMonitorSchema.id"
        :label="$store.getters['type-map/labelFor'](serviceMonitorSchema, 2)"
      >
        <TypeDescription :resource="serviceMonitorSchema.id" />
        <ResourceTable
          :schema="serviceMonitorSchema"
          :rows="serviceMonitors"
        />
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang='scss' scoped>
.header{
  display: flex;
  H1{
    flex: 1;
  }
}
</style>
