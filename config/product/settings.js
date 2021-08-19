import { DSL } from '@/store/type-map';
import { MANAGEMENT } from '@/config/types';
import {
  STATE,
  SIMPLE_NAME,
  FEATURE_DESCRIPTION,
  RESTART,
} from '@/config/table-headers';

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
    ifHaveVerb:          'PUT',
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

  basicType([
    'settings',
    'features',
    'brand'
  ]);

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
