<script lang="ts">
import ExplorerProjectsNamespaces from '@shell/components/ExplorerProjectsNamespaces.vue';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../../config/harvester';
import { MANAGEMENT } from '~/shell/config/types';
export default {
  components: { ExplorerProjectsNamespaces },
  data() {
    return {
      createProjectLocation: {
        name:   `${ HARVESTER_PRODUCT }-c-cluster-resource-create`,
        params: {
          product:  HARVESTER_PRODUCT,
          cluster:  this.$store.getters['currentCluster']?.id,
          resource: MANAGEMENT.PROJECT
        },
      }
    };
  }
};
</script>

<template><ExplorerProjectsNamespaces v-bind="$attrs" :create-project-location-override="createProjectLocation" /></template>
