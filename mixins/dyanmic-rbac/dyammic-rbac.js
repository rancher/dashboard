
import { mapGetters } from 'vuex';

import { CAPI, MANAGEMENT, SCHEMA } from '@/config/types';

import waitFor from '@/utils/waitFor';

export default {
  data() {
    return {
      initialClusterCount: 0,

      waitingForResource: false,
      dynamicSchema:      MANAGEMENT.NODE
    };
  },

  computed: {
    ...mapGetters(['dynamicRBAC']),

    mgmtClusterId() {
      const pCluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, this.clusterId);

      return this.value?.status?.clusterName || pCluster?.status?.clusterName;
    },

    // Determine if the dashboard has all of the dynamic resources following a cluster create. Ideally this would be as simple as seeing if the user is an admin
    hasDynamicSchema() {
      const hasDynamicSchema = this.$store.getters['management/schemaFor'](this.dynamicSchema);

      // console.warn('cluster-rbac: ', 2, hasDynamicSchema, this.initialClusterCount)
      return !!hasDynamicSchema;
    },
  },

  methods: {
    async dynamicRbacFetch() {
      // Fetch number of clusters before attempt to create one, also register our interest in this resource type (in case we start on this page)
      const clusters = await this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });

      this.initialClusterCount = clusters?.length; // Needs to be stored before clusters updates
    },

    async handleDynamicRBAC() {
      // An admin has access to all resource schemas and can exercise all(?) actions against individual resources and resource collections
      // Non-admins however begin with a very small set of schemas and some only with POST rights. After they have access to a single cluster
      // they gain the rights required to continue.
      // These rights are not pushed to the client, so behold....

      // Before refreshing schemas / resource types via resetting the subscription ensure that the backend has caught up with the RBAC
      // changes following the cluster creation
      await this.waitForNewSchemaAccess();

      // Refresh that schema/resource instance states
      await this.$store.dispatch('loadManagement', true);

      // loadManagement re-fetches everything else.... but not `provisioning.cattle.io.clusters`, so request / wait again
      await this.waitForProvisioningClusters();
    },

    async setDynamicRBACState(wait) {
      await this.$store.dispatch('setDynamicRBACState', wait);
    },

    // ---

    // Used to handle refreshing sockets in the ember world where we don't wait after cluster creation
    async processDynamicRBAC() {
      if (this.dynamicRBAC && !this.hasDynamicSchema) {
        await this.handleDynamicRBAC();
      }
      await this.setDynamicRBACState(false);
    },

    // ----

    async waitFor() {
      await waitFor.waitFor(...arguments);
    },

    async waitForNewSchemaAccess() {
      // We use the management node as a schema that a non-admin doesn't have access to before their first cluster... but will eventually
      // Once we have this we know the backend will provide the correct responses for when we reset

      await this.waitFor(
        () => this.$store.getters['management/byId'](SCHEMA, this.dynamicSchema),
        (nodeSchema) => {
          if (!!nodeSchema) {
            return true;
          }
        },
        () => this.$store.dispatch('management/find', { type: SCHEMA, id: this.dynamicSchema }),
        'Mgmt Node Schema',
        'Failed to fetch new schemas'
      );
    },

    async waitForProvisioningClusters() {
      await this.waitFor(
        () => this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER),
        (clusters) => {
          return !!clusters?.[0];
        },
        () => this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER, opt: { force: true } }),
        'Provisioning Cluster',
        'Failed to find provisioning cluster'
      );
    },

  }

};
