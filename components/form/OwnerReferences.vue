<script>
/*
  OwnerReferences accepts a resource proxy object and, if it has metadata.ownerReferences will:
    * query store for referenced resources
    * display ownerRef resources in SortableTable
*/
import { NAME } from '@/config/table-headers';
import loadDeps from '@/mixins/load-deps';
import SortableTable from '@/components/SortableTable';

export default {
  components: { SortableTable },
  mixins:     [loadDeps],
  props:      {
    // resource instance with metadata.ownerReferences to display
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const { metadata:{ ownerReferences = [] } } = this.value;

    const ownersByType = {};

    // gather ownerrefs by 'kind' field
    ownerReferences.forEach((owner) => {
      if (!ownersByType[owner.kind]) {
        ownersByType[owner.kind] = [owner];
      } else {
        ownersByType[owner.kind].push(owner);
      }
    });

    return { ownersByType, owners: [] };
  },
  computed: {
    tableHeaders() {
      return [
        {
          name:  'apiVersion',
          label: 'API Version',
          value: 'apiVersion',
          sort:  ['apiVersion'],
          width:     125,

        },
        {
          name:   'kind',
          label: 'Kind',
          value:  'kind',
          sort:   ['kind'],
        },
        NAME
      ];
    },
  },

  mounted() {
    this.findOwners();
  },

  methods: {
    async findOwners() {
      /*
        all we have is api version, kind, and uid, but we can't query by uid :(
        find all of each kind of ownerref present, then find each specific ownerref by metadata.uid
      */
      for ( const kind in this.ownersByType) {
        const schema = this.$store.getters['cluster/schema'](kind);

        if (schema) {
          const type = schema.id;
          const allOfResourceType = await this.$store.dispatch('cluster/findAll', { type });

          this.ownersByType[kind].forEach((resource, idx) => {
            const resourceInstance = allOfResourceType.filter(resource => resource?.metdata?.uid === resource.uid)[0];

            this.owners.push(resourceInstance);
          });
        }
      }
    }
  }
};
</script>

<template>
  <div>
    <SortableTable key-field="id" :rows="owners" :headers="tableHeaders" :search="false" />
  </div>
</template>
