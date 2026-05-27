import { buildMonitoringUrl } from '@shell/utils/grafana';

const GRAFANA_PROXY_BASE = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy';

interface DashboardDefinition {
  uid: string;
  slug: string;
  proxyUrl: string;
}

function makeDashboard(uid: string, slug: string): DashboardDefinition {
  return {
    uid,
    slug,
    proxyUrl: `${ GRAFANA_PROXY_BASE }/d/${ uid }/${ slug }?orgId=1`,
  };
}

export const GRAFANA_DASHBOARDS = {
  CLUSTER_DETAIL:   makeDashboard('rancher-cluster-nodes-1', 'rancher-cluster-nodes'),
  CLUSTER_SUMMARY:  makeDashboard('rancher-cluster-1', 'rancher-cluster'),
  K8S_DETAIL:       makeDashboard('rancher-k8s-components-nodes-1', 'rancher-kubernetes-components-nodes'),
  K8S_SUMMARY:      makeDashboard('rancher-k8s-components-1', 'rancher-kubernetes-components'),
  ETCD_DETAIL:      makeDashboard('rancher-etcd-nodes-1', 'rancher-etcd-nodes'),
  ETCD_SUMMARY:     makeDashboard('rancher-etcd-1', 'rancher-etcd'),
  NODE_DETAIL:      makeDashboard('rancher-node-detail-1', 'rancher-node-detail'),
  NODE_SUMMARY:     makeDashboard('rancher-node-1', 'rancher-node'),
  POD_DETAIL:       makeDashboard('rancher-pod-containers-1', 'rancher-pod-containers'),
  POD_SUMMARY:      makeDashboard('rancher-pod-1', 'rancher-pod'),
  WORKLOAD_DETAIL:  makeDashboard('rancher-workload-pods-1', 'rancher-workload-pods'),
  WORKLOAD_SUMMARY: makeDashboard('rancher-workload-1', 'rancher-workload'),
} as const;

export type GrafanaDashboardKey = keyof typeof GRAFANA_DASHBOARDS;

interface DashboardValues {
  grafanaURL?: string;
  [key: string]: unknown;
}

export function resolveDashboardUrl(dashboardValues: DashboardValues, key: GrafanaDashboardKey): string {
  const dashboard = GRAFANA_DASHBOARDS[key];

  if (dashboardValues?.grafanaURL) {
    return buildMonitoringUrl(dashboardValues.grafanaURL, `d/${ dashboard.uid }/${ dashboard.slug }?orgId=1`);
  }

  return dashboard.proxyUrl;
}
