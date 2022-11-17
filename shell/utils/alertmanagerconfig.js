import jsyaml from 'js-yaml';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import { MONITORING, SECRET } from '@shell/config/types';
import { get, set } from '@shell/utils/object';
import isEmpty from 'lodash/isEmpty';
import { ROOT_NAME } from '@shell/models/monitoring.coreos.com.route';

const DEFAULT_SECRET_ID = 'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager';
const ALERTMANAGER_ID = 'cattle-monitoring-system/rancher-monitoring-alertmanager';

export const FILENAME = 'alertmanager.yaml';

export async function getSecretId(dispatch) {
  const alertManager = await dispatch('cluster/find', { type: MONITORING.ALERTMANAGER, id: ALERTMANAGER_ID }, { root: true });

  if (alertManager?.spec?.configSecret) {
    return `${ alertManager.namespace }/${ alertManager?.spec?.configSecret }`;
  }

  return DEFAULT_SECRET_ID;
}

export async function getSecret(dispatch) {
  const secretId = await getSecretId(dispatch, false);

  try {
    return await dispatch('cluster/find', { type: SECRET, id: secretId }, { root: true });
  } catch (ex) {
    const [namespace, name] = secretId.split('/');
    const secret = await dispatch('cluster/create', { type: SECRET }, { root: true });

    secret.metadata = {
      namespace,
      name
    };

    return secret;
  }
}

function extractConfig(secret) {
  secret.data = secret.data || {};
  const file = secret.data[FILENAME];
  const decodedFile = file ? base64Decode(file) : '{}';
  const config = jsyaml.load(decodedFile);

  config.receivers = config.receivers || [];
  config.route = config.route || {};
  config.route.routes = config.route.routes || [];

  return config;
}

export async function loadConfig(dispatch) {
  const secret = await getSecret(dispatch);

  return {
    config: extractConfig(secret),
    secret
  };
}

export async function updateConfig(dispatch, path, type, updateFn) {
  const { config, secret } = await loadConfig(dispatch);

  set(config, path, get(config, path) || []);
  setDefaultRouteNames(config.route.routes);

  const newValue = updateFn(get(config, path));

  set(config, path, newValue);

  const routes = config.route.routes;
  const rootIndex = routes.findIndex(route => route.name === ROOT_NAME);

  routes.forEach((route) => {
    if (route.name) {
      delete route.name;
    }
  });

  if (rootIndex >= 0) {
    const rootRoute = routes.splice(rootIndex, 1)[0];

    rootRoute.routes = routes;
    config.route = rootRoute;
  }

  const newFile = jsyaml.dump(config);
  const encodedFile = base64Encode(newFile);

  secret.data[FILENAME] = encodedFile;
  await secret.save();
}

export async function getAllReceivers(dispatch) {
  try {
    const { config, secret } = await loadConfig(dispatch);
    const receivers = config.receivers || [];
    const receiversWithName = receivers.filter(receiver => receiver.name);
    const mapped = receiversWithName.map(receiver => dispatch('cluster/create', {
      id:   receiver.name,
      spec: receiver,
      type: MONITORING.SPOOFED.RECEIVER,
      secret
    }, { root: true }));

    return Promise.all(mapped);
  } catch (ex) {
    return [];
  }
}

export async function getAllRoutes(dispatch) {
  try {
    const { config, secret } = await loadConfig(dispatch);

    config.route = config.route || {};
    config.route.name = ROOT_NAME;
    const routes = config.route?.routes || [];

    setDefaultRouteNames(routes);

    routes.push(config.route);

    const mapped = routes.map(route => dispatch('cluster/create', {
      id:   route.name,
      spec: route,
      type: MONITORING.SPOOFED.ROUTE,
      secret
    }, { root: true }));

    return Promise.all(mapped);
  } catch (ex) {
    return [];
  }
}

function setDefaultRouteNames(routes) {
  routes.forEach((route, i) => {
    route.name = route.name || createDefaultRouteName(i);
  });
}

export function createDefaultRouteName(index) {
  return `route-${ index }`;
}

export function areRoutesSupportedFormat(secret) {
  try {
    const config = extractConfig(secret);
    const routes = config.route?.routes || [];

    return !routes.some(isEmpty);
  } catch (ex) {
    return false;
  }
}

export function canCreate(rootGetters) {
  return rootGetters['type-map/optionsFor'](SECRET).isCreatable;
}
