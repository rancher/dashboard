<script>
import CreateEditView from '@/mixins/create-edit-view';
import Tab from '@/components/Tabbed/Tab';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import { STATE, SIMPLE_NAME, IMAGE } from '@/config/table-headers';
import { sortableNumericSuffix } from '@/utils/sort';
import { findBy } from '@/utils/array';

export default {
  name: 'PodDetail',

  components: {
    ResourceTabs,
    Tab,
    SortableTable,
  },

  mixins: [CreateEditView],

  computed:   {
    containers() {
      const { containerStatuses = [] } = this.value.status;

      return (this.value.spec.containers || []).map((container) => {
        container.status = findBy(containerStatuses, 'name', container.name) || {};
        container.stateDisplay = this.value.containerStateDisplay(container);
        container.stateBackground = this.value.containerStateColor(container).replace('text', 'bg');
        container.nameSort = sortableNumericSuffix(container.name).toLowerCase();
        container.readyIcon = container?.status?.ready ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-x icon-2x text-error ml-5';

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
          width:         75
        },
        {
          ...SIMPLE_NAME,
          value: 'name'
        },
        IMAGE,
        {
          name:     'restarts',
          labelKey: 'tableHeaders.restarts',
          value:    'status.restartCount',
          align:    'right',
          width:    75
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
  },
};
</script>

<template>
  <ResourceTabs mode="view" class="mt-20" :value="value">
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
