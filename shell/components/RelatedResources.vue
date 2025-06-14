<script>
import ResourceTable from '@shell/components/ResourceTable';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NAME, NAMESPACE, STATE, TYPE } from '@shell/config/table-headers';
import { sortableNumericSuffix } from '@shell/utils/sort';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { BadgeState } from '@components/BadgeState';
import { useStore } from 'vuex';
import { computed, toValue } from 'vue';

export function getFilteredRelationships(resource, ignoreTypes = [], rel = null, direction = 'to') {
  let all = resource?.metadata?.relationships || [];

  // @TODO probably will need more flexible filtering here for
  // related resources other than helm app resources...

  all = all.filter((relationship) => {
    const type = relationship[`${ direction }Type`];

    if (!type || ignoreTypes.includes(type)) {
      return false;
    }

    if (rel && relationship.rel !== rel) {
      return false;
    }

    return true;
  });

  return all;
}

export function useFetchRelatedResources(store, resource, ignoreTypes = [], rel = null, direction = 'to') {
  const cluster = store.getters['clusterId'];
  const inStore = store.getters['currentStore']();
  const out = [];

  for ( const r of getFilteredRelationships(resource, ignoreTypes, rel, direction)) {
    const state = r.state || 'active';
    const stateColor = colorForState(state, r.error, r.transitioning);
    const type = r[`${ direction }Type`];
    const schema = store.getters[`${ inStore }/schemaFor`](type);

    let name = r[`${ direction }Id`];

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

    out.push({
      type,
      real:     store.getters[`${ inStore }/byId`](type, r[`${ direction }Id`]),
      id:       r[`${ direction }Id`],
      state,
      metadata: { namespace, name },
      _key:     key,

      name,
      namespace,
      nameDisplay: name,
      nameSort:    sortableNumericSuffix(name).toLowerCase(),

      stateColor,
      detailLocation,
      typeDisplay:     store.getters['type-map/labelFor'](schema),
      stateDisplay:    stateDisplay(state),
      stateBackground: stateColor.replace('text-', 'bg-'),
      groupByLabel:    namespace,
    });
  }

  return out;
}

export async function useFetchRelatedResourcesTab(resource) {
  const store = useStore();
  const resourceValue = toValue(resource);

  const referredToBy = computed(() => useFetchRelatedResources(store, resourceValue, resourceValue.type, null, 'from'));
  const refersTo = computed(() => useFetchRelatedResources(store, resourceValue, resourceValue.type));

  return { referredToBy: referredToBy.value, refersTo: refersTo.value };
}

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
    rows() {
      if ( this.loadedResources < 1 ) {
        // This does nothing except force recompute when loaded resources change below
        return;
      }

      return useFetchRelatedResources(this.$store, this.value, this.ignoreTypes, this.rel, this.direction);
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
      <BadgeState
        v-if="row.real"
        :value="row.real"
      />
      <BadgeState
        v-else
        :value="row"
      />
    </template>
  </ResourceTable>
</template>
