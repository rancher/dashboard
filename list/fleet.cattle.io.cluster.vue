<script>
import SortableTable from '@/components/SortableTable';
import { get } from '@/utils/object';
import ButtonGroup from '@/components/ButtonGroup';
import { STATE, NAME, AGE } from '@/config/table-headers';
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';
import { removeObject } from '@/utils/array';
import { FLEET, MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';

export default {
  name:       'ListCluster',
  components: {
    ButtonGroup, SortableTable, Loading
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    this.rows = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  data() {
    return { rows: null };
  },

  computed: {
    headers() {
      const workspace = {
        name:  'workspace',
        label: 'Workspace',
        value: 'mgmt.spec.fleetWorkspaceName',
        sort:  ['mgmt.spec.fleetWorkspaceName', 'nameSort'],
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
          name:          'lastUpdated',
          labelKey:      'tableHeaders.lastUpdated',
          value:         'status.agent.lastSeen',
          sort:          'status.agent.lastSeen',
          search:        false,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         120,
          align:         'right'
        },
        {
          ...AGE,
          value: 'mgmt.metadata.creationTimestamp',
          sort:  'mgmt.metadata.creationTimestamp',
        }
      ];

      if ( this.groupBy || !this.groupable ) {
        removeObject(out, workspace);
      }

      return out;
    },

    group: mapPref(GROUP_RESOURCES),

    groupable() {
      return true;
    },

    groupBy() {
      // The value of the preference is "namespace" but we take that to mean group by workspace here...
      if ( this.groupable && this.group === 'namespace') {
        return 'groupByLabel';
      }

      return null;
    },

    groupOptions() {
      return [
        { value: 'none', icon: 'icon-list-flat' },
        { value: 'namespace', icon: 'icon-list-grouped' }
      ];
    },

    pagingParams() {
      return {
        singularLabel: this.$store.getters['type-map/labelFor'](this.schema),
        pluralLabel:   this.$store.getters['type-map/labelFor'](this.schema, 99),
      };
    },
  },

  methods: { get },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <SortableTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging="true"
    paging-label="sortableTable.paging.resource"
    :paging-params="pagingParams"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="groupable" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup v-model="group" :options="groupOptions" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab" v-html="thisGroup.ref" />
    </template>

    <template #cell:workspace="{row}">
      <span v-if="row.mgmt.spec.fleetWorkspaceName">{{ row.mgmt.spec.fleetWorkspaceName }}</span>
      <span v-else class="text-muted">&ndash;</span>
    </template>

    <template #cell:bundlesReady="{row}">
      <span v-if="row.bundleInfo.unready" class="text-warning">{{ row.bundleInfo.ready }}/{{ row.bundleInfo.total }}</span>
      <span v-else>{{ row.bundleInfo.total }}</span>
    </template>

    <template #cell:nodesReady="{row}">
      <span v-if="row.nodeInfo.unready" class="text-warning">{{ row.nodeInfo.ready }}/{{ row.nodeInfo.total }}</span>
      <span v-else>{{ row.nodeInfo.total }}</span>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
  ::v-deep .sub-row TD {
    padding: 5px 0;
  }

  ::v-deep .sub-spacer TD {
    padding: 0;
    height: 0;
  }
</style>
