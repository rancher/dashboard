<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 * Any updates to receiver configuration forms, such as Slack/email/PagerDuty
 * etc, should be made to the receiver forms that are based on the
 * AlertmanagerConfig resource, which has a different API. The new forms are
 * located in @shell/edit/monitoring.coreos.com.alertmanagerconfig/types.
 */
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { Banner } from '@components/Banner';
import { MONITORING } from '@shell/config/types';
import { areRoutesSupportedFormat, getSecret } from '@shell/utils/alertmanagerconfig';
import { MODE, _EDIT } from '@shell/config/query-params';

export default {
  name:       'ListRoute',
  components: {
    Banner,
    Loading,
    ResourceTable,
    Tab,
    Tabbed,
  },

  async fetch() {
    this.routeSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.ROUTE);
    this.receiverSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.RECEIVER);

    const routes = this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.ROUTE });

    this.receivers = await this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.RECEIVER });

    const secret = await getSecret(this.$store.dispatch);
    const areSomeRoutesInvalidFormat = areRoutesSupportedFormat(secret);

    if (areSomeRoutesInvalidFormat) {
      this.$store.dispatch('type-map/configureType', { match: MONITORING.SPOOFED.ROUTE, isCreatable: true });
      this.routes = await routes;
    } else {
      this.$store.dispatch('type-map/configureType', { match: MONITORING.SPOOFED.ROUTE, isCreatable: false });
      this.secretTo = { ...secret.detailLocation };
      this.secretTo.query = { [MODE]: _EDIT };
    }
  },

  data() {
    const initTab = this.$route.query.resource || MONITORING.SPOOFED.RECEIVER;

    return {
      routes: [], receivers: [], secretTo: null, routeSchema: null, receiverSchema: null, initTab
    };
  },
  computed: {

    createRoute() {
      const activeResource = this.$refs?.tabs?.activeTabName || this.routeSchema.id;

      return {
        name:   'c-cluster-monitoring-route-receiver-create',
        params: { cluster: this.$route.params.cluster },
        query:  { resource: activeResource }
      };
    },
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row header mb-10">
      <h1>  {{ t('monitoring.routesAndReceivers') }}</h1>
      <div>
        <button
          class="btn btn-lg role-primary float right"
          @click="$router.push(createRoute)"
        >
          {{ t('resourceList.head.create') }}
        </button>
      </div>
    </div>
    <div class="row">
      <Banner
        color="info"
        :label="t('monitoring.alertmanagerConfig.deprecationWarning')"
      />
    </div>
    <Tabbed
      ref="tabs"
      :default-tab="initTab"
    >
      <Tab
        :name="routeSchema.id"
        :label="$store.getters['type-map/labelFor'](routeSchema, 2)"
      >
        <div v-if="secretTo">
          We don't support the current route format stored in alertmanager.yaml. Click
          <router-link :to="secretTo">
            here
          </router-link> to update manually.
        </div>
        <ResourceTable
          v-else
          :schema="routeSchema"
          :rows="routes"
        />
      </Tab>
      <Tab
        :name="receiverSchema.id"
        :label="$store.getters['type-map/labelFor'](receiverSchema, 2)"
      >
        <ResourceTable
          :schema="receiverSchema"
          :rows="receivers"
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
