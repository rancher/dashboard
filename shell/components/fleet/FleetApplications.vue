<script lang="ts">
import { PropType } from 'vue';
import { checkPermissions } from '@shell/utils/auth';
import { FLEET } from '@shell/config/types';
import { Application } from '@shell/types/fleet';
import ResourceTable from '@shell/components/ResourceTable.vue';
import FleetIntro from '@shell/components/fleet/FleetIntro.vue';
import {
  AGE,
  NAME,
  STATE,
  FLEET_APPLICATION_TYPE,
  FLEET_APPLICATION_SOURCE,
  FLEET_APPLICATION_TARGET,
  FLEET_APPLICATION_CLUSTERS_READY,
  FLEET_APPLICATION_RESOURCES_SUMMARY,
} from '@shell/config/table-headers';

interface Permissions {
  gitRepos: boolean,
  helmOps: boolean,
}

interface DataType {
  permissions: Permissions
}

export default {
  name: 'FleetApplications',

  components: {
    FleetIntro,
    ResourceTable,
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    workspace: {
      type:    String,
      default: ''
    },

    clusterId: {
      type:     String,
      required: false,
      default:  null,
    },

    rows: {
      type:     Array as PropType<Application[]>,
      required: true,
    },

    loading: {
      type:     Boolean,
      required: false,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },

    showIntro: {
      type:    Boolean,
      default: true,
    }
  },

  async fetch() {
    try {
      const permissionsSchemas = {
        gitRepos: {
          type:            FLEET.GIT_REPO,
          schemaValidator: (schema: any) => schema.resourceMethods.includes('PUT')
        },
        helmOps: {
          type:            FLEET.HELM_OP,
          schemaValidator: (schema: any) => schema.resourceMethods.includes('PUT')
        },
      };

      const permissions = await checkPermissions(permissionsSchemas, this.$store.getters) as Permissions;

      this.permissions = permissions;
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
  },

  data(): DataType {
    return {
      permissions: {
        gitRepos: true,
        helmOps:  true
      }
    };
  },

  computed: {
    createLocation() {
      return { name: 'c-cluster-fleet-application-create' };
    },

    filteredRows() {
      if (!this.rows) {
        return [];
      }

      const selectedNamespaces = this.$store.getters['namespaces']();

      return this.rows.filter((row) => {
        if (this.workspace) {
          return this.workspace === row.metadata.namespace;
        }

        return !!selectedNamespaces[row.metadata.namespace];
      });
    },

    isClusterView() {
      return !!this.clusterId;
    },

    shouldShowIntro() {
      return this.showIntro && !this.filteredRows.length;
    },

    headers() {
      return [
        STATE,
        NAME,
        FLEET_APPLICATION_TYPE,
        FLEET_APPLICATION_SOURCE,
        FLEET_APPLICATION_TARGET,
        FLEET_APPLICATION_CLUSTERS_READY,
        FLEET_APPLICATION_RESOURCES_SUMMARY,
        AGE
      ];
    },
  },
};
</script>

<template>
  <div>
    <FleetIntro
      v-if="shouldShowIntro && !loading"
      :schema="schema"
      :is-creatable="permissions.gitRepos || permissions.helmOps"
      :labelKey="'application'"
      :route="createLocation"
      :icon="'icon-repository'"
    />
    <ResourceTable
      v-if="!shouldShowIntro"
      v-bind="$attrs"
      key-field="_key"
      :schema="schema"
      :headers="headers"
      :rows="filteredRows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :namespaced="!workspace"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
