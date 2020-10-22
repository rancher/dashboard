<script>
import { NAME, CHART_NAME } from '@/config/product/logging';
import InstallRedirect from '@/utils/install-redirect';
import { LOGGING } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import { allHash } from '@/utils/promise';
import {
  FLOW, CONFIGURED_PROVIDERS, CLUSTER_FLOW, CLUSTER_OUTPUT, OUTPUT, NAMESPACE
} from '@/config/table-headers';
import ChartHeading from '@/components/ChartHeading';
import TypeDescription from '@/components/TypeDescription';

export default {
  middleware: InstallRedirect(NAME, CHART_NAME),
  components: {
    ChartHeading, SortableTable, TypeDescription
  },
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
        { ...NAMESPACE, value: 'flow.metadata.namespace' },
        FLOW,
        OUTPUT,
        CLUSTER_OUTPUT,
        CONFIGURED_PROVIDERS
      ],
      clusterFlowTableHeaders: [
        CLUSTER_FLOW, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS
      ]
    };
  },

  computed: {
    clusterLevelLogging() {
      return this.mapFlows(this.clusterFlows, this.clusterOutputs);
    },

    namespaceLevelLogging() {
      return this.mapFlows(this.flows, this.outputs);
    },

    hasClusterFlowAccess() {
      return this.$store.getters[`cluster/schemaFor`](LOGGING.CLUSTER_FLOW);
    }
  },

  methods: {
    mapFlows(flows) {
      return flows.map((flow) => {
        return {
          flow:           this.link(flow),
          outputs:        flow.outputs.map(this.link),
          clusterOutputs: flow.clusterOutputs.map(this.link),
          providers:      flow.outputProviders
        };
      });
    },

    link(resource) {
      return {
        text:    resource.nameDisplay,
        url:     resource.detailLocation,
        ...resource
      };
    }
  }
};
</script>

<template>
  <div class="logging">
    <TypeDescription resource="logging" />
    <ChartHeading :label="t('logging.overview.poweredBy')" url="https://github.com/banzaicloud/logging-operator" />
    <div class="spacer" />
    <div v-if="hasClusterFlowAccess">
      <h2>{{ t('logging.overview.clusterLevel') }}</h2>
      <SortableTable
        class="sortable-table"
        :headers="clusterFlowTableHeaders"
        :rows="clusterLevelLogging"
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
      :rows="namespaceLevelLogging"
      :row-actions="false"
      :search="false"
      :table-actions="false"
      key-field="id"
    />
  </div>
</template>
