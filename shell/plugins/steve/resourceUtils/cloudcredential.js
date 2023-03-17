import { CAPI } from '@shell/config/types';
import { driverMap } from '@shell/utils/plugins';

export function _getConfigKey(resource) {
  return Object.keys(resource).find( k => k.endsWith('credentialConfig'));
}

export function _getProvider(resource) {
  const annotation = resource.annotations?.[CAPI.CREDENTIAL_DRIVER];

  if ( annotation ) {
    return annotation;
  }

  const configKey = resource.configKey;

  // Call [amazoneks,amazonec2] -> aws
  if ( configKey ) {
    const name = (configKey.replace(/credentialConfig$/, '') || '').toLowerCase();

    return driverMap[name] || name;
  }

  return null;
}

export function _getProviderDisplay(resource, { translateWithFallback }) {
  const provider = (resource.provider || '').toLowerCase();

  return translateWithFallback(`cluster.provider."${ provider }"`, null, provider);
}

export const calculatedFields = [
  { name: 'parsedReport', func: _getConfigKey },
  {
    name: 'provider', func: _getProvider, dependsOn: ['configKey']
  },
  {
    name: 'providerDisplay', func: _getProviderDisplay, dependsOn: ['provider']
  }
];
