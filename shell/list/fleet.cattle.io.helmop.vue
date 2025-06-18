<script>
import FleetHelmOps from '@shell/components/fleet/FleetHelmOps.vue';
import Masthead from '@shell/components/ResourceList/Masthead';
import FleetNoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import { FLEET } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';

export default {
  name:       'ListHelmOps',
  components: {
    FleetHelmOps,
    Masthead,
    FleetNoWorkspaces,
  },
  mixins: [ResourceFetch],
  props:  {
    schema: {
      type:     Object,
      required: true,
    },

    resource: {
      type:     String,
      required: true,
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    try {
      const hash = await checkSchemasForFindAllHash({
        cluster: {
          inStoreType: 'management',
          type:        FLEET.CLUSTER
        },
        clusterGroups: {
          inStoreType: 'management',
          type:        FLEET.CLUSTER_GROUP
        },

        helmOps: {
          inStoreType: 'management',
          type:        FLEET.HELM_OP
        },

        workspaces: {
          inStoreType: 'management',
          type:        FLEET.WORKSPACE
        },

      }, this.$store);

      this.hasWorkspaces = (hash.workspaces || []).length > 0;
    } catch (e) {
    }

    try {
      const permissions = await checkPermissions({ workspaces: { type: FLEET.WORKSPACE }, helmOps: { type: FLEET.HELM_OP } }, this.$store.getters);

      this.permissions = permissions;
    } catch (e) {
    }
    await this.$fetchType(this.resource);
  },

  data() {
    return { hasWorkspaces: false, permissions: {} };
  },
};
</script>

<template>
  <div v-if="hasWorkspaces">
    <Masthead
      :schema="schema"
      :resource="resource"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
      :create-button-label="t('fleet.helmOp.actions.add')"
    />
    <FleetHelmOps
      :rows="rows"
      :schema="schema"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
  <div v-else>
    <FleetNoWorkspaces :can-view="permissions.workspaces" />
  </div>
</template>
