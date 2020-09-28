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

export default {
  middleware: InstallRedirect(NAME, CHART_NAME),
  components: { ChartHeading, SortableTable },
  async fetch() {
    const hash = await allHash({
      clusterFlows:   this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_FLOW }),
      flows:          this.$store.dispatch('cluster/findAll', { type: LOGGING.FLOW }),
      clusterOutputs: this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUT }),
      outputs:         this.$store.dispatch('cluster/findAll', { type: LOGGING.OUTPUT }),
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
    }
  },

  methods: {
    mapFlows(flows) {
      return flows.map((flow) => {
        return {
          flow: this.link(flow), outputs: flow.outputs.map(this.link), providers: flow.outputProviders
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
    <ChartHeading label="Banzai Cloud" url="https://github.com/banzaicloud/logging-operator" />
    <div class="spacer" />
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
    <h2 class="mt-20">
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
