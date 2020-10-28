<script>
import ResourceTable from '@/components/ResourceTable';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
import { NAME, NAMESPACE, STATE, TYPE } from '@/config/table-headers';
import { sortableNumericSuffix } from '@/utils/sort';
import { filterBy } from '@/utils/array';
import { NAME as EXPLORER } from '@/config/product/explorer';
import BadgeState from '@/components/BadgeState';

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

      if ( this.rel ) {
        all = filterBy(all, 'rel', 'helmresource');
      }

      return all;
    },

    rows() {
      if ( this.loadedResources < 1 ) {
        // This does nothing except force recompute when loaded resources change below
        return;
      }

      const cluster = this.$store.getters['clusterId'];
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.filteredRelationships.map((r) => {
        const state = r.state || 'active';
        const stateColor = colorForState(state, r.error, r.transitioning);
        const type = r.toType;
        const schema = this.$store.getters[`${ inStore }/schemaFor`](type);

        let name = r.toId;
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
            cluster,
            resource: type,
            namespace,
            id:       name,
          }
        };

        return {
          type,
          real: this.$store.getters[`${ inStore }/byId`](type, r.toId),
          id:   r.toId,
          state,
          namespace,
          _key: key,

          name,
          nameDisplay: name,
          nameSort:    sortableNumericSuffix(name).toLowerCase(),

          stateColor,
          detailLocation,
          typeDisplay:     this.$store.getters['type-map/labelFor'](schema),
          stateDisplay:    stateDisplay(state),
          stateBackground: stateColor.replace('text-', 'bg-'),
          groupByLabel:    namespace,
        };
      });
    },

    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        TYPE,
      ];
    },
  },

  methods: {
    async getRealResources(rows) {
      const inStore = this.$store.getters['currentProduct'].inStore;

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
    :force-namespaced="true"
    :mangle-action-resources="getRealResources"
    paging-label="sortableTable.paging.generic"
  >
    <template #cell:state="{row}">
      <BadgeState v-if="row.real" :value="row.real" />
      <BadgeState v-else :value="row" />
    </template>
  </ResourceTable>
</template>
