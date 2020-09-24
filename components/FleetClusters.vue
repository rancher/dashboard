<script>
import ButtonGroup from '@/components/ButtonGroup';
import SortableTable from '@/components/SortableTable';
import { removeObject } from '@/utils/array';
import { STATE, NAME, AGE } from '@/config/table-headers';
import { FLEET, MANAGEMENT } from '@/config/types';

export default {
  components: { ButtonGroup, SortableTable },

  props: {
    rows: {
      type:     Array,
      required: true,
    },

    groupable: {
      type:    Boolean,
      default: false,
    },

    group: {
      type:    String,
      default: null,
    },

    groupBy: {
      type:    String,
      default: null,
    },

    groupOptions: {
      type:    Array,
      default: null,
    },
  },

  computed: {
    MANAGEMENT_CLUSTER() {
      return MANAGEMENT.CLUSTER;
    },

    headers() {
      const workspace = {
        name:  'workspace',
        label: 'Workspace',
        value: 'metadata.namespace',
        sort:  ['metadata.namespace', 'nameSort'],
      };

      const out = [
        STATE,
        NAME,
        workspace,
        {
          name:      'bundlesReady',
          labelKey:  'tableHeaders.bundlesReady',
          value:     'status.display.readyBundles',
          sort:      'status.summary.ready',
          search:    false,
        },
        {
          name:      'nodesReady',
          labelKey:  'tableHeaders.nodesReady',
          value:     'status.display.readyBundles',
          sort:      'status.summary.ready',
          search:    false,
        },
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

      if ( this.groupBy || !this.groupable ) {
        removeObject(out, workspace);
      }

      return out;
    },

    pagingParams() {
      const inStore = this.$store.getters['currentProduct'].inStore;
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
  <SortableTable
    v-bind="$attrs"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging-params="pagingParams"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="groupable" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup :value="group" :options="groupOptions" @input="$emit('set-group', $event)" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab" v-html="thisGroup.ref" />
    </template>

    <template #cell:workspace="{row}">
      <span v-if="row.type !== MANAGEMENT_CLUSTER && row.metadata.namespace">{{ row.metadata.namespace }}</span>
      <span v-else class="text-muted">&mdash;</span>
    </template>

    <template #cell:bundlesReady="{row}">
      <span v-if="!row.bundleInfo" class="text-muted">&mdash;</span>
      <span v-else-if="row.bundleInfo.unready" class="text-warning">{{ row.bundleInfo.ready }}/{{ row.bundleInfo.total }}</span>
      <span v-else>{{ row.bundleInfo.total }}</span>
    </template>

    <template #cell:nodesReady="{row}">
      <span v-if="!row.nodeInfo" class="text-muted">&mdash;</span>
      <span v-else-if="row.nodeInfo.unready" class="text-warning">{{ row.nodeInfo.ready }}/{{ row.nodeInfo.total }}</span>
      <span v-else :class="{'text-error': !row.nodeInfo.total}">{{ row.nodeInfo.total }}</span>
    </template>
  </SortableTable>
</template>
