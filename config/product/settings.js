import { FEATURE_DESCRIPTION, RESTART, SIMPLE_NAME, STATE } from '@/config/table-headers';
import { MANAGEMENT } from '@/config/types';
import { DSL } from '@/store/type-map';

export const NAME = 'settings';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
    virtualType,
    headers,
    hideBulkActions,
  } = DSL(store, NAME);

  product({
    ifHaveType:          new RegExp(`${ MANAGEMENT.SETTING }|${ MANAGEMENT.FEATURE }`, 'i'),
    inStore:             'management',
    icon:                'globe',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
  });

  virtualType({
    ifHaveType:     MANAGEMENT.SETTING,
    labelKey:       'advancedSettings.label',
    name:           'settings',
    namespaced:     false,
    weight:         99,
    icon:           'folder',
    route:          {
      name:   'c-cluster-product-resource',
      params: {
        product:  NAME,
        resource: MANAGEMENT.SETTING
      }
    }
  });

  virtualType({
    ifHaveType:     MANAGEMENT.FEATURE,
    labelKey:       'featureFlags.label',
    name:           'features',
    namespaced:     false,
    weight:         99,
    icon:           'folder',
    route:          {
      name:   'c-cluster-product-resource',
      params: {
        product:  NAME,
        resource: MANAGEMENT.FEATURE
      }
    }
  });

  virtualType({
    ifHaveType:     MANAGEMENT.SETTING,
    labelKey:       'branding.label',
    name:           'brand',
    namespaced:     false,
    weight:         98,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-brand' }
  });

  virtualType({
    label:          'Global DNS Entries',
    name:           'global-dns-entries',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-pages-page', params: { cluser: 'local', page: 'global-dns-entries' } },
    exact:          true
  });

  virtualType({
    label:          'Global DNS Providers',
    name:           'global-dns-providers',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-pages-page', params: { cluser: 'local', page: 'global-dns-providers' } },
    exact:          true
  });

  virtualType({
    label:          'Pod Security Policies',
    name:           'pod-security-policies',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-pages-page', params: { cluser: 'local', page: 'pod-security-policies' } },
    exact:          true
  });

  basicType([
    'settings',
    'features',
    'brand'
  ]);

  basicType([
    'global-dns-entries',
    'global-dns-providers',
    'pod-security-policies'
  ], 'Legacy Configuration');

  configureType(MANAGEMENT.SETTING, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    showState:   false,
    canYaml:     false,
  });

  configureType(MANAGEMENT.FEATURE, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    showState:   true,
    canYaml:     false,
  });

  headers(MANAGEMENT.FEATURE, [
    STATE,
    RESTART,
    SIMPLE_NAME,
    FEATURE_DESCRIPTION,
  ]);

  hideBulkActions(MANAGEMENT.FEATURE, true);
}
