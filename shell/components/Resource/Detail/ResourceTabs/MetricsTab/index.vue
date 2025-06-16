<script lang="ts">
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { WORKLOAD_TYPES, WORKLOAD_TYPE_TO_KIND_MAPPING } from '@shell/config/types';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';
import { toValue, computed } from 'vue';

export interface Props {
  tabLabel: string;
  detailUrl: string;
  summaryUrl: string;
  graphVars: any;
  weight?: number;
}

export const useFetchDefaultWorkloadMetricsProps = (workload: any): Props => {
  const workloadValue = toValue(workload);

  const WORKLOAD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-pods-1/rancher-workload-pods?orgId=1';
  const WORKLOAD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-1/rancher-workload?orgId=1';
  const graphVarsWorkload = workloadValue.type === WORKLOAD_TYPES.DEPLOYMENT ? workloadValue.replicaSetId : workloadValue.shortId;
  const graphVars = computed(() => {
    return {
      namespace: workloadValue.namespace,
      kind:      WORKLOAD_TYPE_TO_KIND_MAPPING[workloadValue.type],
      workload:  graphVarsWorkload
    };
  });

  return useFetchDefaultMetricsTabProps(WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL, graphVars);
};

export const useFetchDefaultNodeMetricsTabProps = (node: any): Props => {
  const nodeValue = toValue(node);

  const NODE_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-node-detail-1/rancher-node-detail?orgId=1';
  const NODE_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-node-1/rancher-node?orgId=1';

  const graphVars = computed(() => {
    return { instance: `${ nodeValue.internalIp }:9796` };
  });

  return useFetchDefaultMetricsTabProps(NODE_METRICS_DETAIL_URL, NODE_METRICS_SUMMARY_URL, graphVars);
};

export const useFetchDefaultPodMetricsTabProps = (pod: any): Props => {
  const podValue = toValue(pod);

  const POD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-pod-containers?orgId=1';
  const POD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-pod?orgId=1';

  const graphVars = computed(() => {
    return {
      namespace: podValue.namespace,
      pod:       podValue.name
    };
  });

  return useFetchDefaultMetricsTabProps(POD_METRICS_DETAIL_URL, POD_METRICS_SUMMARY_URL, graphVars);
};

export const useFetchDefaultMetricsTabProps = (detailUrl: string, summaryUrl: string, graphVars: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);

  return {
    tabLabel:   i18n.t('workload.container.titles.metrics'),
    detailUrl:  toValue(detailUrl),
    summaryUrl: toValue(detailUrl),
    graphVars:  toValue(graphVars)
  };
};

// export const useFetchDefaultWorkloadProjectMetricsProps = async(workload: any): Promise<Props> => {
//   const store = useStore();
//   const i18n = useI18n(store);

//   const workloadValue = toValue(workload);

//   const graphVarsWorkload = workloadValue.type === WORKLOAD_TYPES.DEPLOYMENT ? workloadValue.replicaSetId : workloadValue.shortId;

//   const namespace = await store.dispatch('cluster/find', { type: NAMESPACE, id: workloadValue.metadata.namespace });

//   const projectId = namespace?.metadata?.labels[PROJECT];

//   let WORKLOAD_PROJECT_METRICS_DETAIL_URL = '';
//   let WORKLOAD_PROJECT_METRICS_SUMMARY_URL = '';

//   if (projectId) {
//     WORKLOAD_PROJECT_METRICS_DETAIL_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-workload-pods?orgId=1'`;
//     WORKLOAD_PROJECT_METRICS_SUMMARY_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-workload?orgId=1`;

//     const showProjectMetrics = await useAllGrafanaDashboardExist(this.currentCluster.id, [WORKLOAD_PROJECT_METRICS_DETAIL_URL, WORKLOAD_PROJECT_METRICS_SUMMARY_URL], 'cluster', projectId);
//   }

//   return {
//     tabLabel:   i18n.t('workload.container.titles.metrics'),
//     detailUrl:  WORKLOAD_PROJECT_METRICS_DETAIL_URL,
//     summaryUrl: WORKLOAD_PROJECT_METRICS_SUMMARY_URL,
//     graphVars:  {
//       namespace: workload.namespace,
//       kind:      WORKLOAD_TYPE_TO_KIND_MAPPING[workload.type],
//       workload:  graphVarsWorkload
//     }
//   };
// };
</script>

<script lang="ts" setup>
const {
  tabLabel, detailUrl, summaryUrl, graphVars, weight
} = defineProps<Props>();
</script>

<template>
  <Tab
    :label="tabLabel"
    :name="tabLabel"
    :weight="weight"
  >
    <template #default="props">
      <DashboardMetrics
        v-if="props.active"
        :detail-url="detailUrl"
        :summary-url="summaryUrl"
        :vars="graphVars"
        graph-height="550px"
      />
    </template>
  </Tab>
</template>
