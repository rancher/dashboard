<script>
import ResourceTable from '@/components/ResourceTable';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
import { NAME, NAMESPACE, STATE, TYPE } from '@/config/table-headers';
import { sortableNumericSuffix } from '@/utils/sort';
import { filterBy } from '@/utils/array';
import { NAME as EXPLORER } from '@/config/product/explorer';

export default {
  components: { ResourceTable },

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
      const product = this.$store.getters['productId'];
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
          state,
          namespace,

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
  }
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
    paging-label="sortableTable.paging.generic"
  >
  </ResourceTable>
</template>
