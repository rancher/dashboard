<script>
import { NODE, WORKLOAD_TYPES } from '@/config/types';
import createEditView from '@/mixins/create-edit-view';
import Tab from '@/components/Tabbed/Tab';
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { mapGetters } from 'vuex';
import { STATE, SIMPLE_NAME, IMAGE } from '@/config/table-headers';
import { sortableNumericSuffix } from '@/utils/sort';
import { findBy } from '@/utils/array';

export default {
  name: 'PodDetail',

  components: {
    ResourceTabs,
    Tab,
    Loading,
    SortableTable
  },

  mixins: [createEditView],

  async fetch() {
    const { nodeName } = this.value.spec;

    const nodes = await this.$store.dispatch('cluster/findAll', { type: NODE });
    const out = nodes.filter((node) => {
      return node?.metadata?.name === nodeName;
    })[0];

    this.node = out;
  },

  async asyncData(ctx) {
    const out = await defaultAsyncData(ctx);

    let node;

    if ( out.value?.spec?.nodeName ) {
      node = await ctx.store.dispatch('cluster/find', { type: NODE, id: out.value.spec.nodeName });
    }
    const owners = await out.value.getOwners() || [];

    const workload = owners.find((owner) => {
      return Object.values(WORKLOAD_TYPES).includes(owner.type);
    });

    out.moreDetails = out.moreDetails || [];

    if ( workload ) {
      out.moreDetails.push({
        label:         'Workload',
        formatter:     'LinkDetail',
        formatterOpts: { row: workload },
        content:       workload.metadata.name
      });
    }

    if ( node ) {
      out.moreDetails.push({
        label:         'Node',
        formatter:     'LinkDetail',
        formatterOpts: { row: node },
        content:       node.metadata.name
      });
    }

    return out;
  },

  computed:   {
    containers() {
      const { containerStatuses = [] } = this.value.status;

      return (this.value.spec.containers || []).map((container) => {
        container.status = findBy(containerStatuses, 'name', container.name) || {};
        container.stateDisplay = this.value.containerStateDisplay(container);
        container.stateBackground = this.value.containerStateColor(container).replace('text', 'bg');
        container.nameSort = sortableNumericSuffix(container.name).toLowerCase();
        container.readyIcon = !container?.status?.ready ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-x ixon-2x text-error ml-5';

        return container;
      });
    },

    containerHeaders() {
      return [
        STATE,
        {
          name:          'ready',
          labelKey:      'tableHeaders.ready',
          formatter:     'IconText',
          formatterOpts: { iconKey: 'readyIcon' },
          align:         'left',
        },
        {
          ...SIMPLE_NAME,
          value: 'name'
        },
        IMAGE,
        {
          name:     'restarts',
          labelKey: 'tableHeaders.restarts',
          value:    'status.restartCount'
        },
        {
          name:          'age',
          labelKey:      'tableHeaders.started',
          value:         'status.state.running.startedAt',
          sort:          'status.state.running.startedAt:desc',
          search:        false,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          align:         'right'
        }
      ];
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else mode="view" class="mt-20" :value="value">
    <Tab :label="t('workload.container.titles.containers')" name="containers" :weight="3">
      <SortableTable
        :rows="containers"
        :headers="containerHeaders"
        :mode="mode"
        key-field="name"
        :search="false"
        :row-actions="false"
        :table-actions="false"
      />
    </Tab>
  </ResourceTabs>
</template>
