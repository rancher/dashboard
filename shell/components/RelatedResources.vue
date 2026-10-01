<script>
import { defineAsyncComponent } from 'vue';
import ResourceTable from '@shell/components/ResourceTable';
import LinkDetail from '@shell/components/formatter/LinkDetail';
import { STATES_ENUM, colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NAME, NAMESPACE, STATE, TYPE } from '@shell/config/table-headers';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { sortableNumericSuffix } from '@shell/utils/sort';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { BadgeState } from '@components/BadgeState';

/**
 * Types whose names are shown with a popover summarising the resource
 */
export const POPOVER_TYPES = [POD, WORKLOAD_TYPES.REPLICA_SET];

export default {
  components: {
    ResourceTable,
    BadgeState,
    LinkDetail,
    ResourcePopover: defineAsyncComponent(() => import('@shell/components/Resource/Detail/ResourcePopover/index.vue')),
  },

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
        const type = r[`${ this.direction }Type`];
        const state = r.state || this.$store.getters[`${ inStore }/byId`](type, r[`${ this.direction }Id`])?.state || STATES_ENUM.MISSING;
        const stateColor = colorForState(state, r.error, r.transitioning);
        const schema = this.$store.getters[`${ inStore }/schemaFor`](type);

        let name = r[`${ this.direction }Id`];

        // Skip things like toType/toNamespace+selector for now
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

        // Having an undefined param can yield a console warning like [Vue Router warn]: Discarded invalid param(s) "namespace" when navigating
        if (!detailLocation.params.namespace) {
          delete detailLocation.params.namespace;
        }

        out.push({
          type,
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
    hasPopover(row) {
      return POPOVER_TYPES.includes(row.type);
    },

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
      <BadgeState :value="row" />
    </template>
    <template #cell:name="cell">
      <!-- The table already shows the state, so the popover doesn't repeat it next to the name -->
      <ResourcePopover
        v-if="hasPopover(cell.row)"
        :id="cell.row.id"
        :type="cell.row.type"
        :name="cell.row.nameDisplay"
        :detail-location="cell.row.detailLocation"
        :show-status="false"
        lazy
      />
      <LinkDetail
        v-else
        :row="cell.row"
        :value="cell.value"
        :col="cell.col"
      />
    </template>
  </ResourceTable>
</template>
