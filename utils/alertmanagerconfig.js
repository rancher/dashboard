import jsyaml from 'js-yaml';
import { base64Decode, base64Encode } from '@/utils/crypto';
import { MONITORING, SECRET } from '@/config/types';
import { get, set } from '@/utils/object';
import isEmpty from 'lodash/isEmpty';
import { ROOT_NAME } from '@/models/monitoring.coreos.com.route';

const DEFAULT_SECRET_ID = 'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager';
const ALERTMANAGER_ID = 'cattle-monitoring-system/rancher-monitoring-alertmanager';

export const FILENAME = 'alertmanager.yaml';

export async function getSecretId(dispatch) {
  const isLocal = dispatch.name === 'boundDispatch';
  const action = isLocal ? 'cluster/find' : 'find';
  const alertManager = await dispatch(action, { type: MONITORING.ALERTMANAGER, id: ALERTMANAGER_ID });

  return alertManager?.spec?.configSecret || DEFAULT_SECRET_ID;
}

export async function getSecret(dispatch) {
  const secretId = await getSecretId(dispatch, false);

  try {
    const isLocal = dispatch.name === 'boundDispatch';
    const action = isLocal ? 'cluster/find' : 'find';

    return await dispatch(action, { type: SECRET, id: secretId });
  } catch (ex) {
    const [namespace, name] = secretId.split('/');
    const secret = await dispatch('create', { type: SECRET });

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
  const config = jsyaml.safeLoad(decodedFile);

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

  const newValue = updateFn(get(config, path));

  set(config, path, newValue);

  const routes = config.route.routes;
  const rootIndex = routes.findIndex(route => route.name === ROOT_NAME);

  if (rootIndex >= 0) {
    const rootRoute = routes.splice(rootIndex, 1)[0];

    rootRoute.routes = routes;
    config.route = rootRoute;
  }

  const newFile = jsyaml.safeDump(config);
  const encodedFile = base64Encode(newFile);

  secret.data[FILENAME] = encodedFile;
  await secret.save();
  // Force a store update
  await dispatch('findAll', { type, opt: { force: true } });
}

export async function getAllReceivers(dispatch) {
  try {
    const { config, secret } = await loadConfig(dispatch);
    const receivers = config.receivers || [];
    const receiversWithName = receivers.filter(receiver => receiver.name);
    const mapped = receiversWithName.map(receiver => dispatch('cluster/create', {
      id:    receiver.name,
      spec:  receiver,
      type:  MONITORING.SPOOFED.RECEIVER,
      secret
    }));

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
    const routesWithName = routes.filter(route => route.name);

    routesWithName.push(config.route);

    const mapped = routesWithName.map(route => dispatch('cluster/create', {
      id:    route.name,
      spec:  route,
      type:  MONITORING.SPOOFED.ROUTE,
      secret
    }));

    return Promise.all(mapped);
  } catch (ex) {
    return [];
  }
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
  return rootGetters['type-map/isCreatable'](SECRET);
}
