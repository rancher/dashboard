import { DSL } from '@shell/store/type-map';
import { MANAGEMENT, HELM } from '@shell/config/types';
import {
  STATE,
  FEATURE_DESCRIPTION,
  RESTART,
  NAME_UNLINKED,
} from '@shell/config/table-headers';

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
    weight:         100,
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
    ifHaveType:     MANAGEMENT.SETTING,
    labelKey:       'banner.settingName',
    name:           'banners',
    namespaced:     false,
    weight:         98,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-banners' }
  });

  virtualType({
    ifHaveType:     MANAGEMENT.SETTING,
    labelKey:       'performance.settingName',
    name:           'performance',
    namespaced:     false,
    weight:         97,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-performance' }
  });

  virtualType({
    ifHaveType:     MANAGEMENT.SETTING,
    labelKey:       'customLinks.label',
    name:           'links',
    namespaced:     false,
    weight:         96,
    icon:           'folder',
    route:          { name: 'c-cluster-settings-links' }
  });

  basicType([
    'settings',
    'features',
    'brand',
    'banners',
    'performance',
    'links'
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

  configureType(MANAGEMENT.PROJECT, {
    isCreatable: true,
    isRemovable: true,
    showAge:     false,
    showState:   false,
    canYaml:     true,
  });

  configureType(HELM.PROJECTHELMCHART, {
    isCreatable: true,
    isRemovable: true,
    showAge:     true,
    showState:   true,
    canYaml:     true,
  });

  headers(MANAGEMENT.FEATURE, [
    STATE,
    NAME_UNLINKED,
    FEATURE_DESCRIPTION,
    RESTART,
  ]);

  hideBulkActions(MANAGEMENT.FEATURE, true);
}
