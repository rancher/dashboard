import { parse as parseUrl, addParam } from '@shell/utils/url';
import { MONITORING } from '@shell/config/types';
import { compare } from '@shell/utils/version';
import { CATALOG } from '@shell/config/types';

const MONITORING_VERSION_NEW_URL_PATTERN = '102.0.0+up40.1.2';

export function getClusterPrefix(monitoringVersion, clusterId) {
  if (compare(monitoringVersion, MONITORING_VERSION_NEW_URL_PATTERN) >= 0) {
    return `/k8s/clusters/${ clusterId }`;
  }

  return clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
}

export function computeDashboardUrl(monitoringVersion, embedUrl, clusterId, params) {
  const url = parseUrl(embedUrl);

  let newUrl = `${ getClusterPrefix(monitoringVersion, clusterId) }${ url.path }`;

  if (url.query.viewPanel) {
    newUrl = addParam(newUrl, 'viewPanel', url.query.viewPanel);
  }
  newUrl = addParam(newUrl, 'orgId', url.query.orgId);
  newUrl = addParam(newUrl, 'kiosk', null);

  Object.entries(params).forEach((entry) => {
    newUrl = addParam(newUrl, entry[0], entry[1]);
  });

  return newUrl;
}

export async function dashboardExists(monitoringVersion, store, clusterId, embedUrl, storeName = 'cluster') {
  if (!isMonitoringInstalled(store.getters, storeName)) {
    return false;
  }

  const url = parseUrl(embedUrl);
  const prefix = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/`;
  const delimiter = 'http:rancher-monitoring-grafana:80/proxy/';
  const path = url.path.split(delimiter)[1];
  const uid = path.split('/')[1];
  const newUrl = `${ prefix }api/dashboards/uid/${ uid }`;

  try {
    await store.dispatch(`${ storeName }/request`, { url: newUrl, redirectUnauthorized: false });

    return true;
  } catch (ex) {
    return false;
  }
}

export async function allDashboardsExist(store, clusterId, embeddedUrls, storeName = 'cluster') {
  const res = await store.dispatch(`cluster/find`, { type: CATALOG.APP, id: 'cattle-monitoring-system/rancher-monitoring' });
  const monitoringVersion = res?.currentVersion;

  const existPromises = embeddedUrls.map(url => dashboardExists(monitoringVersion, store, clusterId, url, storeName));

  return (await Promise.all(existPromises)).every(exists => exists);
}

export function queryGrafana(monitoringVersion, dispatch, clusterId, query, range, step) {
  const url = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/api/datasources/proxy/1/api/v1/query_range?query=${ query }&start=${ range.start }&end=${ range.end }&step=${ step }`;

  return dispatch('cluster/request', { url, redirectUnauthorized: false });
}

export async function hasLeader(monitoringVersion, dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (5 * 60);

  const response = await queryGrafana(monitoringVersion, dispatch, clusterId, 'max(etcd_server_has_leader)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] === '1';
}

export async function leaderChanges(monitoringVersion, dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (60 * 60);

  const response = await queryGrafana(monitoringVersion, dispatch, clusterId, 'max(etcd_server_leader_changes_seen_total)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] || 0;
}

export async function failedProposals(monitoringVersion, dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (60 * 60);

  const response = await queryGrafana(monitoringVersion, dispatch, clusterId, 'sum(etcd_server_proposals_failed_total)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] || 0;
}

function isMonitoringInstalled(getters, storeName = 'cluster') {
  return !!getters[`${ storeName }/schemaFor`](MONITORING.SERVICEMONITOR);
}
