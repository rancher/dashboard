import {
  getClusterMonitoringDashboardValues,
  getMonitoringApp,
  haveV2Monitoring
} from '@shell/utils/monitoring';
import { parse as parseUrl, addParam } from '@shell/utils/url';

// these two versions of monitoring included a bug fix attempt that required the local cluster to use a different url
// the solution going forward doesn't require this, see https://github.com/rancher/dashboard/issues/8885
const MONITORING_VERSION_ALT_URL = ['100.2.0+up40.1.2', '102.0.0+up40.1.2'];

export function getClusterPrefix(monitoringVersion, clusterId) {
  if (MONITORING_VERSION_ALT_URL.includes(monitoringVersion)) {
    return `/k8s/clusters/${ clusterId }`;
  }

  return clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
}

function isAbsoluteUrl(url) {
  return !!(url.protocol && url.authority);
}

function trimTrailingSlash(url = '') {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getDashboardUid(embedUrl) {
  const url = parseUrl(embedUrl);
  const pathParts = url.path.split('/').filter(Boolean);
  const dashboardPathIndex = pathParts.findIndex((part) => part === 'd');

  if (dashboardPathIndex < 0) {
    return '';
  }

  return pathParts[dashboardPathIndex + 1] || '';
}

function hasDashboardInventoryEntry(dashboardValues, uid) {
  const dashboards = dashboardValues?.rancherDashboards;

  if (!dashboards || !uid) {
    return true;
  }

  if (Array.isArray(dashboards)) {
    return dashboards.includes(uid);
  }

  return Object.prototype.hasOwnProperty.call(dashboards, uid);
}

export function buildMonitoringUrl(baseUrl, path) {
  if (!baseUrl) {
    return '';
  }

  const normalizedBaseUrl = trimTrailingSlash(baseUrl);
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return `${ normalizedBaseUrl }/${ normalizedPath }`;
}

export function buildMonitoringDashboardUrl(dashboardValues, uid, slug, fallbackUrl) {
  if (!dashboardValues?.grafanaURL) {
    return fallbackUrl;
  }

  return buildMonitoringUrl(dashboardValues.grafanaURL, `d/${ uid }/${ slug }?orgId=1`);
}

export function isGrafanaProxied(dashboardValues = {}) {
  const url = dashboardValues.grafanaURL;

  if (!url) {
    return true;
  }

  try {
    new URL(url);

    return false;
  } catch {
    return true;
  }
}

export function computeDashboardUrl(monitoringVersion, embedUrl, clusterId, params, modifyPrefix = true) {
  const url = parseUrl(embedUrl);

  let newUrl;

  if (!modifyPrefix && isAbsoluteUrl(url)) {
    newUrl = `${ url.protocol }://${ url.authority }${ url.path }`;
  } else if (modifyPrefix) {
    newUrl = `${ getClusterPrefix(monitoringVersion, clusterId) }${ url.path }`;
  } else {
    newUrl = url.path;
  }

  if (url.query.viewPanel) {
    newUrl = addParam(newUrl, 'viewPanel', url.query.viewPanel);
  }
  newUrl = addParam(newUrl, 'orgId', url.query.orgId);
  newUrl = addParam(newUrl, 'kiosk', null);
  newUrl = addParam(newUrl, '_dash.hideTimePicker', 'true');

  Object.entries(params).forEach((entry) => {
    newUrl = addParam(newUrl, entry[0], entry[1]);
  });

  return newUrl;
}

export async function dashboardExists(monitoringVersion, store, clusterId, embedUrl, storeName = 'cluster', projectId = null, dashboardValues = {}) {
  if (!projectId && dashboardValues.rancherDashboards) {
    return hasDashboardInventoryEntry(dashboardValues, getDashboardUid(embedUrl));
  }

  if ( !haveV2Monitoring(store.getters) ) {
    return false;
  }

  const url = parseUrl(embedUrl);
  let prefix = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/`;
  let delimiter = 'http:rancher-monitoring-grafana:80/proxy/';

  if (projectId) {
    prefix = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/`;
    delimiter = `http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/`;
  }
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

export async function allDashboardsExist(store, clusterId, embeddedUrls, storeName = 'cluster', projectId = null) {
  let monitoringVersion = '';
  let dashboardValues = {};

  if (!projectId) {
    const monitoringApp = await getMonitoringApp(store, storeName);

    monitoringVersion = monitoringApp?.currentVersion || '';
    dashboardValues = await getClusterMonitoringDashboardValues(store, storeName);
  }

  const existPromises = embeddedUrls.map((url) => dashboardExists(monitoringVersion, store, clusterId, url, storeName, projectId, dashboardValues));

  return (await Promise.all(existPromises)).every((exists) => exists);
}

export async function resolveMonitoringDashboardConfig(store, storeName = 'cluster') {
  const dashboardValues = await getClusterMonitoringDashboardValues(store, storeName);
  const monitoringApp = await getMonitoringApp(store, storeName);

  return {
    dashboardValues,
    monitoringVersion: monitoringApp?.currentVersion || '',
    modifyPrefix:      !dashboardValues.grafanaURL,
    isGrafanaProxied:  isGrafanaProxied(dashboardValues),
  };
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
