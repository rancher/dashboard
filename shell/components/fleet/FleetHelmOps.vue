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

  name: 'FleetHelmOps',

  components: {
    ResourceTable,
    FleetIntro,
  },

  props: {
    clusterId: {
      type:     String,
      required: false,
      default:  null,
    },

    rows: {
      type:     Array,
      required: true,
    },

    schema: {
      type:     Object,
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

  computed: {
    filteredRows() {
      if (!this.rows) {
        return [];
      }

      // Returns boolean { [namespace]: true }
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

  methods: {},
};
</script>

<template>
  <div>
    <FleetIntro
      v-if="noRows && !loading"
      :schema="schema"
      :labelKey="'helmOp'"
      :icon="'icon-helm'"
    />
    <ResourceTable
      v-if="!noRows"
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      key-field="_key"
    />
  </div>
</template>

<style lang="scss" scoped>
.cluster-count-info {
  display: flex;
  align-items: center;

  i {
    margin-left: 5px;
    font-size: 22px;
    color: var(--warning);
  }
}
</style>
