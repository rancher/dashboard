<script>
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { MANAGEMENT, NODE } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import { difference } from 'lodash';

export default {
  props: {
    mode: {
      type:     String,
      default: _EDIT
    },
    value: {
      type:     Object,
      required: true,
    },
    monitoringSettings: {
      type:     Object,
      default:  () => ({}),
      required: true,
    },
    installed: {
      type:    Boolean,
      default: false,
    },
  },

  components: {
    LabeledInput,
    Banner,
    ToggleSwitch,
    ArrayList,
  },

  async fetch() {
    this.originClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });

    await this.initCluster();
  },

  data() {
    return {
      originClusters:     [],
      otherClusterStores: [],
      clusters:           [],
    };
  },

  methods: {
    async initCluster() {
      const nodes = await this.$store.dispatch('rancher/findAll', { type: NODE }, { root: true });
      const enabledClustersBySetting = this.monitoringSettings.enabledClusters || [];
      const out = [];
      const installedClusterId = this.monitoringSettings.clusterId;
      const installedCluster = this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, installedClusterId || 'local');

      this.originClusters.filter(c => c.metadata.state.name === 'active' || c.id === installedCluster.id).forEach((cluster) => {
        const obj = { ...cluster };
        const node = nodes.find((node) => {
          return node.id.indexOf(cluster.id) === 0;
        });

        const currentClusterSetting = enabledClustersBySetting.find(obj => obj.id === cluster.id);

        const address = node?.ipAddress;
        const monitoringNodeIp = address ? `${ address }:30901` : '';

        obj.monitoringNodeIp = monitoringNodeIp;
        obj.monitoringEabled = !this.installed || !!currentClusterSetting;
        obj.value = cluster.id;
        obj.label = cluster.spec.displayName;
        obj.clusterStore = currentClusterSetting?.customStore ? currentClusterSetting.address : '';

        out.push(obj);
      });

      this.clusters = sortBy(out, 'label');

      if (this.monitoringSettings.enabled !== 'true') {
        this.updateClusterStore();
      }
    },
    initOtherClusterStores() {
      let out = [];
      const stores = this.value.thanos.query.stores;

      if (!stores || !stores.length) {
        this.otherClusterStores = [];

        return;
      }

      out = difference(stores, this.monitoringSettings.enabledClusters.map(c => c.address));

      this.$set(this, 'otherClusterStores', out);
    },

    updateClusterStore() {
      let out = [];
      const enabledClusters = this.clusters.filter(c => !!c.monitoringEabled);
      const clusterStores = enabledClusters.map(s => s.clusterStore || s.monitoringNodeIp);
      const otherClusterStores = this.otherClusterStores;

      out = [...clusterStores, ...otherClusterStores];

      this.$set(this.value.thanos.query, 'stores', out);

      Object.assign(this.monitoringSettings, {
        otherClusterStores,
        enabledClusters: enabledClusters.map((c) => {
          return {
            address:      c.clusterStore || c.monitoringNodeIp,
            id:           c.id,
            customStore:  !!c.clusterStore
          };
        })
      });
    },
  },

  created() {
    this.initOtherClusterStores();
  }
};
</script>

<template>
  <div>
    <h3>{{ t('globalMonitoringPage.enableMonitoring.title') }}</h3>
    <Banner
      :closable="true"
      class="cluster-tools-tip"
      color="warning"
      :label="t('globalMonitoringPage.enableMonitoring.warning')"
    />
    <table
      class="sortable-table enable-monitoring mb-20"
      width="100%"
    >
      <thead>
        <tr>
          <th
            class="cluster"
            align="left"
          >
            {{ t('globalMonitoringPage.enableMonitoring.cluster') }}
          </th>
          <th
            class="button"
            align="left"
            width="100"
          >
            {{ t('globalMonitoringPage.enableActionLabel') }}
          </th>
          <th
            class="button"
            align="left"
            width="260"
          >
            {{ t('globalMonitoringPage.customAddress.header') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in clusters"
          :key="c.id"
        >
          <td>{{ c.spec.displayName }} </td>
          <td>
            <ToggleSwitch
              v-model="c.monitoringEabled"
              :labels="[false, true]"
              @input="updateClusterStore"
            />
          </td>
          <td>
            <LabeledInput
              v-model="c.clusterStore"
              :mode="mode"
              :placeholder="t('globalMonitoringPage.customAddress.placeholder')"
              @input="updateClusterStore"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <ArrayList
      v-model="otherClusterStores"
      :title="t('globalMonitoringPage.customAddress.otherHeader')"
      :mode="mode"
      :value-placeholder="t('globalMonitoringPage.customAddress.placeholder')"
      :add-label="t('globalMonitoringPage.customAddress.add')"
      @input="updateClusterStore"
    />
  </div>
</template>

<style lang="scss" scoped>
  .enable-monitoring {
    th {
      padding: 8px 5px;
      font-weight: 400;
      border: 0;
    }
  }
</style>
