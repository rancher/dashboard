import {
  AGE, DESCRIPTION, NAME, SIMPLE_NAME, STATE
} from '@shell/config/table-headers';
import { createExampleRoute, rootExampleRoute } from '../utils/custom-routing';
import { EXAMPLE_PRODUCT_NAME, EXAMPLE_STORE, EXAMPLE_TYPES } from '../types';
import { MULTI_CLUSTER } from '@shell/store/features';

export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    headers,
    configureType,
  } = $plugin.DSL(store, $plugin.name);

  product({
    ifFeature:             MULTI_CLUSTER,
    category:              EXAMPLE_PRODUCT_NAME,
    isMultiClusterApp:     true,
    inStore:               EXAMPLE_STORE,
    icon:                  'linux',
    removable:             false,
    showClusterSwitcher:   false,
    to:                    rootExampleRoute(),
    showNamespaceFilter:   false,
  });

  // Example resource 1
  configureType(EXAMPLE_TYPES.RESOURCE, {
    isCreatable:          true,
    isEditable:           false,
    isRemovable:          true,
    showState:            true,
    canYaml:              false,
    customRoute:          createExampleRoute('c-cluster-resource', { resource: EXAMPLE_TYPES.RESOURCE }),
  });

  configureType(EXAMPLE_TYPES.RESOURCE_2, {
    isCreatable:          false,
    isEditable:           false,
    isRemovable:          false,
    showState:            false,
    canYaml:              false,
    customRoute:          createExampleRoute('c-cluster-resource', { resource: EXAMPLE_TYPES.RESOURCE_2 }),
  });

  // Side Nav
  basicType([
    EXAMPLE_TYPES.RESOURCE,
    EXAMPLE_TYPES.RESOURCE_2
  ]);

  // Headers
  headers(EXAMPLE_TYPES.RESOURCE, [
    STATE,
    NAME,
    DESCRIPTION,
    AGE,
  ]);

  headers(EXAMPLE_TYPES.RESOURCE_2, [
    SIMPLE_NAME,
  ]);

  headers(EXAMPLE_TYPES.CLUSTER, [
    STATE, {
      ...NAME,
      width: 100
    }, {
      ...DESCRIPTION,
      width: null
    }
  ]);
}
