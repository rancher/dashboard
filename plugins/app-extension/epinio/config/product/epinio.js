import { NAME, SIMPLE_NAME } from '@/config/table-headers';
import { DSL } from '@/store/type-map';
import { createEpinioRoute, rootEpinioRoute } from '@/plugins/app-extension/epinio/utils/custom-routing';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/plugins/app-extension/epinio/types';

// TODO: RC DISCUSS Handle localisation in plugins

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    componentForType
  } = DSL(store, EPINIO_PRODUCT_NAME);

  product({
    // ifHaveType:          CAPI.RANCHER_CLUSTER,
    // ifFeature:           MULTI_CLUSTER,
    category:            EPINIO_PRODUCT_NAME,
    isMultiClusterApp:   true,
    inStore:             EPINIO_PRODUCT_NAME,
    icon:                'cluster-management',
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootEpinioRoute()
  });

  configureType(EPINIO_TYPES.INSTANCE, { customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.INSTANCE }) });

  componentForType(EPINIO_TYPES.APP, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.APP, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showState:   false,
    showAge:     false,
    canYaml:     false,
    customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.APP })
  });

  configureType(EPINIO_TYPES.ORG, {
    isCreatable: false,
    showState:   false,
    showAge:     false,
    canYaml:     false,
    customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.ORG })
  });

  basicType([
    EPINIO_TYPES.APP,
    EPINIO_TYPES.ORG
  ]);

  headers(EPINIO_TYPES.APP, [
    // STATE,
    NAME, {
      name:     'active',
      labelKey: 'epinio.tableHeaders.active',
      value:    'active',
      sort:     ['active'],
    }, {
      name:          'org',
      labelKey:      'epinio.tableHeaders.organization',
      value:         'organization',
      sort:          ['organization'],
      formatter:     'LinkDetail',
      formatterOpts: { reference: 'orgLocation' }
    }, {
      name:     'username',
      labelKey: 'epinio.tableHeaders.username',
      value:    'username',
      sort:     ['username'],
    }, {
      name:     'status',
      labelKey: 'epinio.tableHeaders.status',
      value:    'status',
      sort:     ['status'],
    }, {
      name:     'route',
      labelKey: 'epinio.tableHeaders.route',
      value:    'route',
      sort:     ['route'],
    }, {
      name:      'services',
      labelKey:  'epinio.tableHeaders.boundServices',
      value:     'bound_services',
      sort:      ['bound_services'],
      formatter:     'List',
    },
  ]);

  headers(EPINIO_TYPES.ORG, [
    NAME,
  ]);

  headers(EPINIO_TYPES.INSTANCE, [
    SIMPLE_NAME, {
      name:     'api',
      labelKey: 'API', // TODO: RC i10n
      value:    'api',
      sort:     ['api'],
    },
    {
      name:     'pick',
      labelKey: 'Pick', // TODO: RC i10n
    }
  ]);
}
