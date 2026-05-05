<script>
import { MANAGEMENT, HOSTED_PROVIDER, CAPI, CATALOG } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { STATE, NAME } from '@shell/config/table-headers';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@components/Banner/Banner.vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
// import { getCapiProviders } from '@shell/utils/provider';

export default {
  name:       'HostedProviders',
  components: {
    ResourceTable, Masthead, RcStatusBadge, Banner, Checkbox
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
    console.log(this.turtlesChart);

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
    // getProviders() {
    //   const context = {
    //     dispatch:   this.$store.dispatch,
    //     getters:    this.$store.getters,
    //     axios:      this.$store.$axios,
    //     $extension: this.$store.app.$extension,
    //     t:          (...args) => this.t.apply(this, args),
    //   };

    //   return getCapiProviders(context);
    // }

    // Move to a shared location
    async getChartValue() {
      try {
        const res = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:    'cluster',
          repoName:    'stgregistry',
          chartName:   'rancher-turtles-providers',
          versionName: '109.0.1%2Bup0.26.1-rc.0',
        });
      } catch (e) {
        console.error(`Failed to fetch or process chart info for rancher-turtles-providers`); // eslint-disable-line no-console
      }
    },
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

            console.log(providersObj);

            this.appRows = Object.entries(providersObj).map(([id, provider]) => ({
              id,
              enabled:               provider.enabled,
              enableAutomaticUpdate: provider.enableAutomaticUpdate,
              ...provider
            }));
            console.log(this.providersFromApp);
          }
        } catch (err) {
          console.error(`Failed to fetch apps`, err);
        }
      }
    },
    updateProvider(row) {
      if (this.providersFromApp) {
        if (!this.providersFromApp.values) {
          this.providersFromApp.values = {};
        }
        if (!this.providersFromApp.values.providers) {
          this.providersFromApp.values.providers = {};
        }
        if (!this.providersFromApp.values.providers[row.id]) {
          this.providersFromApp.values.providers[row.id] = {};
        }
        this.providersFromApp.values.providers[row.id].enabled = row.enabled;

        // Also update chartValues so it stays in sync in memory
        if (this.providersFromApp.chartValues && this.providersFromApp.chartValues.providers && this.providersFromApp.chartValues.providers[row.id]) {
          this.providersFromApp.chartValues.providers[row.id].enabled = row.enabled;
        }
      }
    }
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
    <ResourceTable
      :schema="schema"
      :resource="resource"
      :rows="rows"
      :row-actions="true"
      :table-actions="true"
      :data-testid="'capi-provider-list'"
      key-field="id"
      class="mb-20"
    />
    <ResourceTable
      :schema="null"
      :resource="null"
      :headers="appHeaders"
      :rows="appRows"
      :row-actions="false"
      :table-actions="false"
      :data-testid="'capi-provider-app-list'"
      key-field="id"
    >
      <!-- <template #cell:enabled="{ row }">
        <Checkbox
          v-model="row.enabled"
          @input="updateProvider(row)"
        />
      </template> -->
    </ResourceTable>
  </div>
</template>
