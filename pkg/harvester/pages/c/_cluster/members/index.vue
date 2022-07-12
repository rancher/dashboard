<script>
import ExplorerMembers from '@shell/components/ExplorerMembers';
import { HARVESTER_NAME } from '@shell/config/product/harvester-manager';
import { MANAGEMENT } from '@shell/config/types';
export default {
  components: { ExplorerMembers },
  computed:   {
    createLocationOverride() {
      return {
        name:   `${ HARVESTER_NAME }-c-cluster-resource-create`,
        params: {
          cluster:  this.$store.getters['currentCluster']?.id,
          resource: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING
        }
      };
    }
  }
};
</script>

<template><ExplorerMembers :create-location-override="createLocationOverride" v-bind="$attrs" /></template>
