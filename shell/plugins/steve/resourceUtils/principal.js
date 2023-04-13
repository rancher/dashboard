import { ucFirst } from '@shell/utils/string';

export function _getDisplayType(resource, _, rootGetters) {
  const provider = rootGetters['i18n/withFallback'](`model.authConfig.provider."${ resource.provider }"`, null, resource.provider);

  return `${ provider } ${ ucFirst(resource.providerSpecificType) }`;
}

export const calculatedFields = [
  {
    name: 'displayType', func: _getDisplayType, caches: ['i18n']
  }
];
