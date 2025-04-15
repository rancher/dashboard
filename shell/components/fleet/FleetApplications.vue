<script>
import ResourceTable from '@shell/components/ResourceTable';
import Link from '@shell/components/formatter/Link';
import Shortened from '@shell/components/formatter/Shortened';
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
    ResourceTable,
    Link,
    Shortened,
    FleetIntro
  },

  props: {
    schema: {
      type:     Object,
      required: true,
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

      const selectedWorkspace = this.$store.getters['namespaces']();

      return this.rows.filter((row) => {
        return !!selectedWorkspace[row.metadata.namespace];
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
      return {
        ...row._detailLocation,
        name: `c-cluster-fleet-application-resource-namespace-id`,
      };
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
      :rows="rows"
      :get-custom-detail-link="getDetailLocation"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
