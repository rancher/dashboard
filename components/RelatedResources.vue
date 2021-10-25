<script>
import ResourceTable from '@/components/ResourceTable';
import { NAME, NAMESPACE, STATE, TYPE } from '@/config/table-headers';
import { sortableNumericSuffix } from '@/utils/sort';
import { NAME as EXPLORER } from '@/config/product/explorer';
import BadgeState from '@/components/BadgeState';
import { colorForState, stateDisplay } from '@/plugins/core-store/resource-instance';

export default {
  components: { ResourceTable, BadgeState },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    rel: {
      type:    String,
      default: null,
    },

    direction: {
      type:    String,
      default: 'to'
    },

    ignoreTypes: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    return { loadedResources: 1 };
  },

  computed: {
    filteredRelationships() {
      let all = this.value?.metadata?.relationships || [];

      // @TODO probably will need more flexible filtering here for
      // related resources other than helm app resources...

      all = all.filter((relationship) => {
        const type = relationship[`${ this.direction }Type`];

        if (!type || this.ignoreTypes.includes(type)) {
          return false;
        }

        if (this.rel && relationship.rel !== this.rel) {
          return false;
        }

        return true;
      });

      return all;
    },

    rows() {
      if ( this.loadedResources < 1 ) {
        // This does nothing except force recompute when loaded resources change below
        return;
      }

      const cluster = this.$store.getters['clusterId'];
      const inStore = this.$store.getters['currentStore']();
      const out = [];

      for ( const r of this.filteredRelationships) {
        const state = r.state || 'active';
        const stateColor = colorForState(state, r.error, r.transitioning);
        const type = r[`${ this.direction }Type`];
        const schema = this.$store.getters[`${ inStore }/schemaFor`](type);

        let name = r[`${ this.direction }Id`];

        // Skip things like toType/toNamspace+selector for now
        if ( !name ) {
          continue;
        }

        let namespace = null;
        const idx = name.indexOf('/');
        const key = `${ type }/${ namespace }/${ name }`;

        if ( idx > 0 ) {
          namespace = name.substr(0, idx);
          name = name.substr(idx + 1);
        }

        const detailLocation = {
          name:   `c-cluster-product-resource${ namespace ? '-namespace' : '' }-id`,
          params: {
            product:  EXPLORER,
            cluster:  inStore === 'management' ? 'local' : cluster,
            resource: type,
            namespace,
            id:       name,
          }
        };

        out.push({
          type,
          real:     this.$store.getters[`${ inStore }/byId`](type, r[`${ this.direction }Id`]),
          id:       r[`${ this.direction }Id`],
          state,
          metadata: { namespace, name },
          _key:     key,

          name,
          namespace,
          nameDisplay: name,
          nameSort:    sortableNumericSuffix(name).toLowerCase(),

          stateColor,
          detailLocation,
          typeDisplay:     this.$store.getters['type-map/labelFor'](schema),
          stateDisplay:    stateDisplay(state),
          stateBackground: stateColor.replace('text-', 'bg-'),
          groupByLabel:    namespace,
        });
      }

      return out;
    },

    headers() {
      return [
        STATE,
        TYPE,
        NAME,
        NAMESPACE,
      ];
    },
  },

  methods: {
    async getRealResources(rows) {
      const inStore = this.$store.getters['currentStore']();

      const res = await Promise.allSettled(rows.map((row) => {
        return this.$store.dispatch(`${ inStore }/find`, { type: row.type, id: row.id });
      }));

      const out = [];

      for ( let i = 0 ; i < res.length ; i++ ) {
        if ( res[i].status === 'fulfilled' ) {
          out.push(res[i].value);
        }
      }

      this.loadedResources++;

      return out;
    }
  },
};
</script>

<template>
  <ResourceTable
    :schema="null"
    :rows="rows"
    :headers="headers"
    :search="false"
    :table-actions="false"
    :namespaced="true"
    :mangle-action-resources="getRealResources"
    paging-label="sortableTable.paging.generic"
    :groupable="false"
  >
    <template #cell:state="{row}">
      <BadgeState v-if="row.real" :value="row.real" />
      <BadgeState v-else :value="row" />
    </template>
  </ResourceTable>
</template>
