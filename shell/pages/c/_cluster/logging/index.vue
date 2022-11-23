<script>
import { NAME, CHART_NAME } from '@shell/config/product/logging';
import InstallRedirect from '@shell/utils/install-redirect';
import { LOGGING } from '@shell/config/types';
import SortableTable from '@shell/components/SortableTable';
import { allHash } from '@shell/utils/promise';
import {
  CONFIGURED_PROVIDERS, CLUSTER_OUTPUT, OUTPUT, NAMESPACE, NAME as NAME_COL
} from '@shell/config/table-headers';
import ChartHeading from '@shell/components/ChartHeading';

export default {
  middleware: InstallRedirect(NAME, CHART_NAME),
  components: { ChartHeading, SortableTable },
  async fetch() {
    const getAllOrDefault = (type) => {
      const hasAccess = this.$store.getters[`cluster/schemaFor`](type);

      return hasAccess ? this.$store.dispatch('cluster/findAll', { type }) : Promise.resolve([]);
    };

    const hash = await allHash({
      clusterFlows:   getAllOrDefault(LOGGING.CLUSTER_FLOW),
      flows:          getAllOrDefault(LOGGING.FLOW),
      clusterOutputs: getAllOrDefault(LOGGING.CLUSTER_OUTPUT),
      outputs:        getAllOrDefault(LOGGING.OUTPUT),
    });

    this.clusterFlows = hash.clusterFlows || [];
    this.flows = hash.flows || [];
  },

  data() {
    return {
      clusterFlows:              [],
      flows:                     [],
      namespaceFlowTableHeaders: [
        NAMESPACE,
        NAME_COL,
        OUTPUT,
        CLUSTER_OUTPUT,
        CONFIGURED_PROVIDERS
      ],
      clusterFlowTableHeaders: [
        NAME_COL, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS
      ]
    };
  },

  computed: {
    hasClusterFlowAccess() {
      return this.$store.getters[`cluster/schemaFor`](LOGGING.CLUSTER_FLOW);
    }
  },
};
</script>

<template>
  <div class="logging">
    <ChartHeading
      :label="t('logging.overview.poweredBy')"
      url="https://github.com/banzaicloud/logging-operator"
    />
    <div class="spacer" />
    <div v-if="hasClusterFlowAccess">
      <h2>{{ t('logging.overview.clusterLevel') }}</h2>
      <SortableTable
        class="sortable-table"
        :headers="clusterFlowTableHeaders"
        :rows="clusterFlows"
        :row-actions="false"
        :search="false"
        :table-actions="false"
        key-field="id"
      />
    </div>
    <h2 :class="{ 'mt-20': hasClusterFlowAccess }">
      {{ t('logging.overview.namespaceLevel') }}
    </h2>
    <SortableTable
      class="sortable-table"
      :headers="namespaceFlowTableHeaders"
      :rows="flows"
      :row-actions="false"
      :search="false"
      :table-actions="false"
      key-field="id"
    />
  </div>
</template>
