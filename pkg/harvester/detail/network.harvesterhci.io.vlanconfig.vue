<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import SortableTable from '@shell/components/SortableTable';

import { allHash } from '@shell/utils/promise';
import { STATE, NAME, AGE } from '@shell/config/table-headers';
import { matching } from '@shell/utils/selector';
import { NODE } from '@shell/config/types';
import { isEmpty } from '@shell/utils/object';

export default {
  components: {
    ResourceTabs,
    Tab,
    SortableTable,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    this.$store.dispatch('harvester/findAll', { type: NODE });

    const hash = { nodes: this.$store.dispatch(`${ inStore }/findAll`, { type: NODE }) };

    await allHash(hash);
  },

  computed:   {
    nodeHeaders() {
      return [
        STATE,
        NAME,
        {
          name:      'host-ip',
          labelKey:  'tableHeaders.hostIp',
          search:    ['internalIp'],
          value:     'internalIp',
        },
        {
          name:          'diskState',
          labelKey:      'tableHeaders.diskState',
          value:         'diskState',
          formatter:     'HarvesterDiskState',
          width:         130,
        },
        AGE,
      ];
    },

    nodes() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      const nodes = this.$store.getters[`${ inStore }/all`](NODE);
      const selector = this.value?.spec?.nodeSelector;

      if (!isEmpty(selector)) {
        return matching(nodes, selector);
      } else {
        return nodes;
      }
    }
  },
};
</script>

<template>
  <ResourceTabs
    v-model="value"
    :need-related="false"
  >
    <Tab
      name="node"
      label-key="harvester.host.label"
      :weight="99"
    >
      <SortableTable
        key-field="_key"
        :headers="nodeHeaders"
        :rows="nodes"
        :row-actions="false"
        :table-actions="false"
        :search="false"
      />
    </Tab>
  </ResourceTabs>
</template>
