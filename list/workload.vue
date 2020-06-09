<script>
import { STATE, AGE, NAMESPACE_NAME, TYPE } from '@/config/table-headers';
import ResourceTable from '@/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA } from '@/config/types';
import { mapGetters } from 'vuex';

const schema = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};

export default {
  name:       'ListWorkload',
  components: { ResourceTable },

  props: {
    // The things out of asyncData come in as props
    resources: {
      type:    Array,
      default: null,
    },
  },

  async asyncData({ store }) {
    const types = Object.values(WORKLOAD_TYPES);

    const resources = await Promise.all(types.map((type) => {
      // You may not have RBAC to see some of the types
      if ( !store.getters['cluster/schemaFor'](type) ) {
        return null;
      }

      return store.dispatch('cluster/findAll', { type });
    }));

    return { resources };
  },

  computed: {
    schema() {
      return schema;
    },

    headers() {
      return [
        STATE,
        NAMESPACE_NAME,
        TYPE,
        {
          name:      'pods',
          label:     this.t('tableHeaders.pods'),
          formatter: 'PodCount',
        },
        AGE,
      ];
    },

    rows() {
      const out = [];

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if ( !row.metadata?.ownerReferences ) {
            out.push(row);
          }
        }
      }

      return out;
    },

    ...mapGetters({ t: 'i18n/t' })

  },

  typeDisplay({ store }) {
    return store.getters['type-map/pluralLabelFor'](schema);
  },
};
</script>

<template>
  <ResourceTable :schema="schema" :rows="rows" :headers="headers" />
</template>
