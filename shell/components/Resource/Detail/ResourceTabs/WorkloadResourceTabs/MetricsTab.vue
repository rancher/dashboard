<script lang="ts">
import Tab from '@shell/components/Tabbed/Tab.vue';
import { I18n } from '@shell/composables/useI18n';
import { Store } from 'vuex';
import { WORKLOAD_TYPES, WORKLOAD_TYPE_TO_KIND_MAPPING, NAMESPACE } from '@shell/config/types';
import { allDashboardsExist } from '@shell/utils/grafana';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';

export interface Props {
  tabLabel: string;
  detailUrl: string;
  summaryUrl: string;
  graphVars: any;
  weight?: number;
}

export const fetchDefaultMetricsProps = async(workload: any, i18n: I18n): Promise<Props> => {
  const WORKLOAD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-pods-1/rancher-workload-pods?orgId=1';
  const WORKLOAD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-1/rancher-workload?orgId=1';
  const graphVarsWorkload = workload.type === WORKLOAD_TYPES.DEPLOYMENT ? workload.replicaSetId : workload.shortId;

  return {
    tabLabel:   i18n.t('workload.container.titles.metrics'),
    detailUrl:  WORKLOAD_METRICS_DETAIL_URL,
    summaryUrl: WORKLOAD_METRICS_SUMMARY_URL,
    graphVars:  {
      namespace: workload.namespace,
      kind:      WORKLOAD_TYPE_TO_KIND_MAPPING[workload.type],
      workload:  graphVarsWorkload
    }
  };
};

export const fetchDefaultProjectMetricsProps = async(workload: any, store: Store<any>, i18n: I18n): Promise<Props> => {
  const graphVarsWorkload = workload.type === WORKLOAD_TYPES.DEPLOYMENT ? workload.replicaSetId : workload.shortId;

  const namespace = await store.dispatch('cluster/find', { type: NAMESPACE, id: workload.metadata.namespace });

  const projectId = namespace?.metadata?.labels[PROJECT];

  let WORKLOAD_PROJECT_METRICS_DETAIL_URL = '';
  let WORKLOAD_PROJECT_METRICS_SUMMARY_URL = '';

  if (projectId) {
    WORKLOAD_PROJECT_METRICS_DETAIL_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-workload-pods?orgId=1'`;
    WORKLOAD_PROJECT_METRICS_SUMMARY_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-workload?orgId=1`;

    const showProjectMetrics = await allDashboardsExist(store, this.currentCluster.id, [WORKLOAD_PROJECT_METRICS_DETAIL_URL, WORKLOAD_PROJECT_METRICS_SUMMARY_URL], 'cluster', projectId);
  }

  return {
    tabLabel:   i18n.t('workload.container.titles.metrics'),
    detailUrl:  WORKLOAD_PROJECT_METRICS_DETAIL_URL,
    summaryUrl: WORKLOAD_PROJECT_METRICS_SUMMARY_URL,
    graphVars:  {
      namespace: workload.namespace,
      kind:      WORKLOAD_TYPE_TO_KIND_MAPPING[workload.type],
      workload:  graphVarsWorkload
    }
  };
};
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
