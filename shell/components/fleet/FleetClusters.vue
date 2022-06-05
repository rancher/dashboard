<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, AGE, FLEET_SUMMARY } from '@shell/config/table-headers';
import { FLEET, MANAGEMENT } from '@shell/config/types';

export default {
  components: { ResourceTable },

  props: {
    rows: {
      type:     Array,
      required: true,
    },

    schema: {
      type:    Object,
      default: null,
    },
  },

  computed: {
    MANAGEMENT_CLUSTER() {
      return MANAGEMENT.CLUSTER;
    },

    headers() {
      const out = [
        STATE,
        NAME,
        {
          name:      'nodesReady',
          labelKey:  'tableHeaders.nodesReady',
          value:     'status.display.readyBundles',
          sort:      'status.summary.ready',
          search:    false,
          align:    'center',
        },
        {
          name:      'reposReady',
          labelKey:  'tableHeaders.reposReady',
          value:     'status.display.readyBundles',
          sort:      'status.summary.ready',
          search:    false,
          align:    'center',
        },
        FLEET_SUMMARY,
        {
          name:          'lastSeen',
          labelKey:      'tableHeaders.lastSeen',
          value:         'status.agent.lastSeen',
          sort:          'status.agent.lastSeen',
          search:        false,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         120,
          align:         'right'
        },
        AGE,
      ];

      return out;
    },

    pagingParams() {
      const inStore = this.$store.getters['currentStore'](FLEET.CLUSTER);
      const schema = this.$store.getters[`${ inStore }/schemaFor`](FLEET.CLUSTER);

      return {
        singularLabel: this.$store.getters['type-map/labelFor'](schema),
        pluralLabel:   this.$store.getters['type-map/labelFor'](schema, 99),
      };
    },
  }
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="rows"
    key-field="_key"
    v-on="$listeners"
  >
    <template #cell:workspace="{row}">
      <span v-if="row.type !== MANAGEMENT_CLUSTER && row.metadata.namespace">{{ row.metadata.namespace }}</span>
      <span v-else class="text-muted">&mdash;</span>
    </template>

    <template #cell:reposReady="{row}">
      <span v-if="!row.repoInfo" class="text-muted">&mdash;</span>
      <span v-else-if="row.repoInfo.unready" class="text-warning">{{ row.repoInfo.ready }}/{{ row.repoInfo.total }}</span>
      <span v-else>{{ row.repoInfo.total }}</span>
    </template>

    <template #cell:nodesReady="{row}">
      <span v-if="!row.nodeInfo" class="text-muted">&mdash;</span>
      <span v-else-if="row.nodeInfo.unready" class="text-warning">{{ row.nodeInfo.ready }}/{{ row.nodeInfo.total }}</span>
      <span v-else :class="{'text-error': !row.nodeInfo.total}">{{ row.nodeInfo.total }}</span>
    </template>
  </ResourceTable>
</template>
