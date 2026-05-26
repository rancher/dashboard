<script>
import { CAPI, CATALOG } from '@shell/config/types';
import { STATE, NAME } from '@shell/config/table-headers';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Loading from '@shell/components/Loading.vue';

export default {
  name:       'HostedProviders',
  components: {
    ResourceTable, Masthead, Loading
  },
  data() {
    return {
      errors:           [],
      rows:             [],
      allProviders:     null,
      turtlesChart:     null,
      resource:         CAPI.CAPI_PROVIDER,
      resourceApp:      CATALOG.APP,
      schema:           this.$store.getters['management/schemaFor'](CAPI.CAPI_PROVIDER),
      schemaApp:        this.$store.getters['currentProduct'].inStore ? this.$store.getters[`${ this.$store.getters['currentProduct'].inStore }/schemaFor`](CATALOG.APP) : null,
      settingResource:  null,
      providersFromApp: null,
      appRows:          []
    };
  },
  async fetch() {
    this.allProviders = await this.$store.dispatch('management/findAll', { type: CAPI.CAPI_PROVIDER });
    await this.$store.dispatch('catalog/load');
    this.turtlesChart = this.$store.getters['catalog/chart']({ chartName: 'rancher-turtles-providers' });

    await this.getApp();

    this.rows = this.allProviders;
  },
  watch:    {},
  computed: {
    headers() {
      return [
        STATE,
        NAME,
      ];
    },
    appHeaders() {
      return [
        {
          name:     'id',
          labelKey: 'tableHeaders.name',
          value:    'id',
          sort:     'id',
        },
        {
          name:  'enabled',
          label: 'Enabled',
          value: 'enabled',
          sort:  'enabled',
        },
        {
          name:  'enableAutomaticUpdate',
          label: 'Enable Automatic Update',
          value: 'enableAutomaticUpdate',
          sort:  'enableAutomaticUpdate',
        }
      ];
    }
  },
  methods: {

    async getApp() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      if (this.$store.getters[`${ inStore }/canList`](CATALOG.APP)) {
        try {
          const apps = await this.$store.dispatch(`${ inStore }/findAll`, { type: CATALOG.APP });
          const res = apps.find((a) => a.spec?.chart?.metadata?.name === 'rancher-turtles-providers');

          if (res) {
            await res.fetchValues(true);
            this.providersFromApp = res;
            const providersObj = res.chartValues?.providers || {};

            this.appRows = Object.entries(providersObj).map(([id, provider]) => ({
              id,
              enabled:               provider.enabled,
              enableAutomaticUpdate: provider.enableAutomaticUpdate,
              ...provider
            }));
          }
        } catch (err) {
          // console.error(`Failed to fetch apps`, err);
        }
      }
    },
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="t('providers.capi.title')"
      :is-creatable="true"
    />
    <Loading v-if="$fetchState.pending" />
    <ResourceTable
      v-else
      :schema="schema"
      :resource="resource"
      :rows="rows"
      :row-actions="true"
      :table-actions="true"
      :data-testid="'capi-provider-list'"
      key-field="id"
      class="mb-20"
    />
  </div>
</template>
