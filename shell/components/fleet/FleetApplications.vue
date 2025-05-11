<script>
import ResourceTable from '@shell/components/ResourceTable';
import FleetIntro from '@shell/components/fleet/FleetIntro';
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
      type:     Array,
      required: true,
    },

    loading: {
      type:     Boolean,
      required: false,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { createLocation: { name: 'c-cluster-fleet-application-create' } };
  },

  computed: {
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

    noRows() {
      return !this.filteredRows.length;
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

  methods: {
    getDetailLocation(row) {
      return row._detailLocation;
    }
  },
};
</script>

<template>
  <div>
    <FleetIntro
      v-if="noRows && !loading"
      :schema="schema"
      :is-creatable="true"
      :labelKey="'application'"
      :route="createLocation"
      :icon="'icon-gear'"
    />
    <ResourceTable
      v-if="!noRows"
      v-bind="$attrs"
      key-field="_key"
      :schema="schema"
      :headers="headers"
      :rows="filteredRows"
      :get-custom-detail-link="getDetailLocation"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :namespaced="!workspace"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
