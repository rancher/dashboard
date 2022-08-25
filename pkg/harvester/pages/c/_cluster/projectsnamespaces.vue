<script lang="ts">
import Vue from 'vue';
import { Location } from 'vue-router';
import ExplorerProjectsNamespaces from '@shell/components/ExplorerProjectsNamespaces.vue';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../../config/harvester';
import { MANAGEMENT } from '@shell/config/types';
interface Data {
  createProjectLocation: Location
}
export default Vue.extend<Data, any, any, any>({
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
});
</script>

<template><ExplorerProjectsNamespaces v-bind="$attrs" :create-project-location-override="createProjectLocation" /></template>
