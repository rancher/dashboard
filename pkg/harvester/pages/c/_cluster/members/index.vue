<script>
import ExplorerMembers from '@shell/components/ExplorerMembers';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../../../config/harvester';
import { MANAGEMENT } from '@shell/config/types';
export default {
  components: { ExplorerMembers },
  computed:   {
    createLocationOverride() {
      return {
        name:   `${ HARVESTER_PRODUCT }-c-cluster-resource-create`,
        params: {
          product:  HARVESTER_PRODUCT,
          cluster:  this.$store.getters['currentCluster']?.id,
          resource: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING
        }
      };
    }
  }
};
</script>

<template><ExplorerMembers :create-location-override="createLocationOverride" v-bind="$attrs" /></template>
