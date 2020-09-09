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
import uniq from 'lodash/uniq';

export default {
  middleware: InstallRedirect(NAME, CHART_NAME),
  components: { ChartHeading, SortableTable },
  async fetch() {
    const hash = await allHash({
      clusterFlows:   this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_FLOWS }),
      flows:          this.$store.dispatch('cluster/findAll', { type: LOGGING.FLOWS }),
      clusterOutputs: this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUTS }),
      outputs:         this.$store.dispatch('cluster/findAll', { type: LOGGING.OUTPUTS }),
    });

    this.clusterFlows = hash.clusterFlows || [];
    this.flows = hash.flows || [];
    this.clusterOutputs = hash.clusterOutputs || [];
    this.outputs = hash.outputs || [];
  },

  data() {
    return {
      clusterFlows:              [],
      flows:                     [],
      clusterOutputs:            [],
      outputs:                   [],
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
    mapFlows(flows, outputs) {
      return flows.map((flow) => {
        const outputRefs = flow.spec.outputRefs;
        const linkedOutputs = outputs.filter((output) => {
          return outputRefs.includes(output.metadata.name);
        }).map(this.link);

        const providers = linkedOutputs
          .flatMap(output => Object.keys(output.spec))
          .filter(provider => provider !== 'loggingRef');

        return {
          flow: this.link(flow), outputs: linkedOutputs, providers: uniq(providers)
        };
      });
    },

    link(resource) {
      return {
        text:    resource.nameDisplay,
        url:     resource.detailLocation,
        options: 'internal',
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
