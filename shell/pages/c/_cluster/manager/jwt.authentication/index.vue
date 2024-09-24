<script>
import { MANAGEMENT } from '@shell/config/types';
import { STATE, AGE } from '@shell/config/table-headers';
import { STATES_ENUM, colorForState } from '@shell/plugins/dashboard-store/resource-class';
import ResourceTable, { defaultTableSortGenerationFn } from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { BadgeState } from '@components/BadgeState';
import TypeDescription from '@shell/components/TypeDescription';

import { exceptionToErrorsArray } from '@shell/utils/error';
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'ClusterProxyConfig',
  components: {
    ResourceTable, Loading, Masthead, BadgeState, Banner, TypeDescription
  },
  mixins: [ResourceFetch],
  async fetch() {
    const hash = {
      mgmtClusters: this.$fetchType(MANAGEMENT.CLUSTER),
      proxyConfig:  this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER_PROXY_CONFIG, opt: { omitExcludeFields: ['metadata.managedFields'] } })
    };

    const res = await allHash(hash);

    this.clusters = res.mgmtClusters;
    this.proxyConfigs = res.proxyConfig;
  },

  data() {
    return {
      clusters:                         [],
      proxyConfigs:                     [],
      resource:                         MANAGEMENT.CLUSTER_PROXY_CONFIG,
      schema:                           this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER_PROXY_CONFIG),
      useQueryParamsForSimpleFiltering: false,
      errors:                           [],
      forceUpdateLiveAndDelayed:        5
    };
  },
  methods: {
    closeError(index) {
      this.errors = this.errors.filter((_, i) => i !== index);
    },
    sortGenerationFn() {
      // This is needed to make sure table gets refreshed when the status changes. Otherwise, it uses cached values.
      const base = defaultTableSortGenerationFn(this.schema, this.$store);

      return base + this.forceUpdateLiveAndDelayed;
    },
  },
  computed: {
    headers() {
      const out = [
        {
          ...STATE,
          value: 'value',
        },
        {
          name:      'clusterName',
          labelKey:  'jwt.headers.clusterName',
          value:     'clusterName',
          sort:      'clusterName',
          search:    ['clusterName'],
          formatter: 'LinkDetail'
        },

        {
          name:      'updatedOn',
          labelKey:  'jwt.headers.updatedOn',
          value:     'updatedOn',
          sort:      'updatedOn',
          formatter: 'Date',
        },
        {
          ...AGE,
          labelKey: 'jwt.headers.clusterAge',
        },
      ];

      return out;
    },
    rows() {
      const proxyConfigMap = new Map();
      const rows = [];

      const enableAction = {
        action:     'activate',
        allEnabled: false,
        anyEnabled: true,
        bulkable:   true,
        enabled:    true,
        icon:       'icon icon-checkmark',
        label:      this.t('jwt.actions.activate'),
        invoke:     async(opts, resources) => {
          const promises = [];

          try {
            resources.forEach((resource) => {
              const res = resource.enable();

              promises.push(res);
            });
            await Promise.all(promises);
          } catch (e) {
            this.errors = exceptionToErrorsArray(e);
          }
        }
      };
      const disableAction = {
        action:     'deactivate',
        allEnabled: false,
        anyEnabled: true,
        bulkable:   true,
        enabled:    true,
        icon:       'icon icon-x',
        label:      this.t('jwt.actions.deactivate'),
        invoke:     async(opts, resources) => {
          const promises = [];

          try {
            resources.forEach((resource) => {
              const res = resource.disable();

              promises.push(res);
            });
            await Promise.all(promises);
          } catch (e) {
            this.errors = exceptionToErrorsArray(e);
          }
        }
      };

      this.proxyConfigs.forEach((config) => {
        const id = config.metadata.namespace;

        proxyConfigMap.set(id, { config });
      });

      this.clusters.forEach((cluster) => {
        const id = cluster.id;
        const clusterName = cluster.spec.displayName;

        if (id !== 'local') {
          const config = proxyConfigMap.get(id)?.config;

          const value = config?.enabled || '';
          const configName = config?.metadata?.name || '';
          let updatedOn = '';

          if (value) {
            updatedOn = config?.metadata?.managedFields?.find((field) => field.operation === 'Update')?.time || '';
          }
          const stateBackground = value ? colorForState(STATES_ENUM.ACTIVE).replace('text', 'bg') : colorForState(STATES_ENUM.INFO).replace('text', 'bg');
          const stateLabel = value ? this.t('jwt.state.enabled') : this.t('jwt.state.disabled');
          const creationTimestamp = cluster.metadata.creationTimestamp;
          const availableActions = value ? [disableAction] : [enableAction];
          const enable = async() => {
            if (!configName) {
              const clusterProxyConfig = await this.$store.dispatch('management/create', {
                enabled:  true,
                metadata: { namespace: id, name: 'clusterproxyconfig' },
              });

              return clusterProxyConfig.save({ url: 'v1/management.cattle.io.clusterproxyconfigs', method: 'POST' });
            } else {
              config.enabled = true;

              return config.save();
            }
          };
          const disable = async() => {
            config.enabled = false;

            return config.save();
          };

          rows.push({
            id, clusterName, value, stateBackground, stateLabel, creationTimestamp, updatedOn, availableActions, enable, disable
          });
        }
      });
      this.forceUpdateLiveAndDelayed = new Date().getTime();

      return rows;
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="outlet"
  >
    <Masthead
      :schema="schema"
      :resource="resource"
      :isCreatable="false"
      :type-display="t('jwt.title')"
    >
      <template #typeDescription>
        <TypeDescription :resource="'jwt.authentication'" />
      </template>
    </Masthead>

    <Banner
      v-for="(err, i) in errors"
      :key="i"
      color="error"
      :label="err"
      :closable="true"
      @close="closeError(i)"
    />

    <ResourceTable
      :schema="schema"
      :headers="headers"
      :key-field="'id'"
      :namespaced="false"
      :rows="rows"
      :tableActions="true"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :sort-generation-fn="sortGenerationFn"
      data-testid="jwt-authentication-list"
    >
      <template #col:state="{row}">
        <td>
          <BadgeState
            :color="row.stateBackground"
            :label="row.stateLabel"
            class="state-bagde"
          />
        </td>
      </template>
    </ResourceTable>
  </div>
</template>
