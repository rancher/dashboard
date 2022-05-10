<script>
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';

import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceTable from '@shell/components/ResourceTable';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import Tab from '@shell/components/Tabbed/Tab';

import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';
import { KEY, VALUE } from '@shell/config/table-headers';
import { POD } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { findBy } from '@shell/utils/array';

export default {
  components: {
    ResourceTable,
    ResourceTabs,
    SortableTable,
    Tab,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      default: 'create',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  async fetch() {
    const hash = { pods: this.value.pods() };

    const res = await allHash(hash);

    for (const k in res) {
      this[k] = res[k];
    }
  },

  data() {
    const servicePortInfoHeaders = [
      {
        name:  'name',
        label: this.t('tableHeaders.name'),
        value: 'name',
        sort:  'name:desc',
      },
      {
        name:  'port',
        label: this.t('tableHeaders.port'),
        value: 'port',
        sort:  'port:desc',
      },
      {
        name:  'protocol',
        label: this.t('tableHeaders.protocol'),
        value: 'protocol',
        sort:  'protocol:desc',
      },
      {
        name:  'targetPort',
        label: this.t('tableHeaders.targetPort'),
        value: 'targetPort',
        sort:  'targetPort:desc',
      },
      {
        name:  'nodePort',
        label: this.t('tableHeaders.nodePort'),
        value: 'nodePort',
        sort:  'nodePort:desc',
      },
      {
        name:      'publicPorts',
        label:     this.t('tableHeaders.publicPorts'),
        value:     'publicPorts',
        formatter: 'Endpoints',
        sort:      'publicPorts:desc',
      },
    ];

    return {
      servicePortInfoHeaders,
      pods:            [],
      podTableHeaders: this.$store.getters['type-map/headersFor'](
        this.$store.getters['cluster/schemaFor'](POD)
      ),
      serviceSelectorInfoHeaders: [
        {
          ...KEY,
          width: 200,
        },
        VALUE,
      ],
    };
  },

  computed: {
    hasPublic() {
      const { metadata: { annotations = {} } } = this.value;

      if (!isEmpty(annotations) && has(annotations, CATTLE_PUBLIC_ENDPOINTS)) {
        return true;
      }

      return false;
    },
    ports() {
      const {
        metadata: { annotations = {} },
        spec,
      } = this.value;
      const ports = spec.ports;
      const publicPorts = this.hasPublic ? JSON.parse(annotations[CATTLE_PUBLIC_ENDPOINTS]) : null;

      return ports.map((port) => {
        const out = {
          ...port,
          publicPorts: [],
        };

        const matchedPublic = findBy(publicPorts, 'port', port.port);

        if (matchedPublic) {
          out.publicPorts = JSON.stringify([matchedPublic]);
        }

        return out;
      });
    },
    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },
    selectorTableRows() {
      return Object.keys(this.value.spec?.selector || {}).map(key => ({
        key,
        value: this.value.spec.selector[key],
      }));
    },
  },
};
</script>

<template>
  <ResourceTabs v-model="value" :mode="mode">
    <Tab name="pods" :label="t('servicesPage.pods.label')" :weight="4">
      <ResourceTable
        :rows="pods"
        :headers="podTableHeaders"
        key-field="id"
        :table-actions="false"
        :schema="podSchema"
        :groupable="false"
        :search="false"
      />
    </Tab>
    <Tab
      name="ports"
      :label="t('servicesPage.ports.label')"
      class="bordered-table"
      :weight="3"
    >
      <SortableTable
        key-field="_key"
        :headers="servicePortInfoHeaders"
        :rows="ports"
        :row-actions="false"
        :table-actions="false"
        :search="false"
      />
    </Tab>
    <Tab
      name="selector"
      :label="t('servicesPage.selectors.label')"
      class="bordered-table"
      :weight="2"
    >
      <SortableTable
        key-field="_key"
        :headers="serviceSelectorInfoHeaders"
        :rows="selectorTableRows"
        :row-actions="false"
        :table-actions="false"
        :show-headers="true"
        :search="false"
      />
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
</style>
