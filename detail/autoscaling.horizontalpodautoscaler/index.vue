<script>
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import Tab from '@/components/Tabbed/Tab';

export default {
  components: {
    ResourceTabs,
    SortableTable,
    Tab,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      default: 'view',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  data() {
    return {
      metricHeaders: [
        {
          name:  'metric-source',
          label: this.t('hpa.metrics.source'),
          value: 'metricSource',
          sort:  'metricSource:desc',
        },
        {
          name:  'resource-name',
          label: this.t('hpa.metrics.headers.resource'),
          value: 'resourceName',
          sort:  'resourceName:desc',
        },
        {
          name:  'object-name',
          label: this.t('hpa.metrics.headers.objectName'),
          value: 'objectName',
          sort:  'objectName:desc',
        },
        {
          name:  'object-kind',
          label: this.t('hpa.metrics.headers.objectKind'),
          value: 'objectKind',
          sort:  'objectKind:desc',
        },
        {
          name:  'metric-name',
          label: this.t('hpa.metrics.headers.metricName'),
          value: 'metricName',
          sort:  'metricName:desc',
        },
        {
          name:  'target-name',
          label: this.t('hpa.metrics.headers.targetName'),
          value: 'targetName',
          sort:  'targetName:desc',
        },
        {
          name:  'quantity',
          label: this.t('hpa.metrics.headers.quantity'),
          value: 'targetValue',
          sort:  'targetValue:desc',
        },
      ],
    };
  },
};
</script>

<template>
  <ResourceTabs v-model="value" :mode="mode">
    <Tab
      name="metrics"
      :label="t('hpa.tabs.metrics')"
      class="bordered-table"
      :weight="3"
    >
      <SortableTable
        key-field="_key"
        :headers="metricHeaders"
        :rows="value.mappedMetrics"
        :row-actions="false"
        :table-actions="false"
        :search="false"
      />
    </Tab>
  </ResourceTabs>
</template>
