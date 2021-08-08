
import Vue from 'vue';

import { CAPI, MANAGEMENT } from '@/config/types';

import DynamicRBAC from '@/mixins/dyanmic-rbac/dyammic-rbac';

export default {

  mixins: [
    DynamicRBAC
  ],

  computed: {
    clusterId() {
      return this.value?.id;
    },

  },

  methods: {
    async dynamicRbacHookFetch() {
      await this.dynamicRbacFetch();
    },

    // Wait until all dynamic resources are available, cluster specific
    async waitForDynamicResources(doneAction) {
      // Wait for sockets to be reset (if needed, see comment in handleDynamicRBAC) and for the required resources to be available
      try {
        // Given we're about to rip out a lot of resources from underneath components ensure we hide them first to avoid undefined.x errors
        Vue.set(this, 'waitingForResource', true);

        if (!this.hasDynamicSchema && this.initialClusterCount === 0) {
          await this.handleDynamicRBAC();
        }

        await this.waitForProvisioningCluster();

        await this.waitForMgmtName();

        await this.waitForMgmt();

        // Do anything additional in the same context before returning
        // This avoids setting waitingForResource to true here (to show any errors) and the blip of screen components whilst anything extra
        // happens afterwards
        doneAction && doneAction(this.mgmtClusterId);
      } catch (e) {
        Vue.set(this, 'waitingForResource', false);
        throw e;
      }
    },

    async waitForProvisioningCluster() {
      if (this.value) {
        return this.value.id;
      }

      await this.waitFor(
        () => this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER),
        (clusters) => {
          if (!!clusters?.[0]) {
            return clusters[0].id;
          }
        },
        () => this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER, opt: { force: true } }),
        'Provisioning Cluster',
        'Failed to find provisioning cluster'
      );
    },

    async waitForMgmtName() {
      await this.waitFor(
        () => this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, this.clusterId),
        (provisioningCluster) => {
          if (!!provisioningCluster?.status?.clusterName) {
            return true;
          }
        },
        () => this.$store.dispatch('management/find', {
          type: CAPI.RANCHER_CLUSTER,
          id:   this.clusterId,
          opt:  { force: true }
        }),
        'Mgmt Name',
        'Failed to fetch mgmt cluster name from provisioning cluster'
      );
    },

    async waitForMgmt() {
      const provisioningCluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, this.clusterId);
      const mgmtId = provisioningCluster.status.clusterName; // This should be populated by now

      await this.waitFor(
        () => this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, mgmtId),
        (mgmt) => {
          if (!!mgmt) {
            return true;
          }
        },
        () => this.$store.dispatch('management/find', {
          type: MANAGEMENT.CLUSTER,
          id:   mgmtId,
          opt:  { force: true }
        }),
        'Mgmt Cluster',
        'Failed to fetch mgmt cluster name from provisioning cluster'
      );
    },
  }

};
