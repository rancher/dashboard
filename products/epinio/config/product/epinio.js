import { NAME, SIMPLE_NAME, STATE } from '@/config/table-headers';
import { DSL } from '@/store/type-map';
import { createEpinioRoute, rootEpinioRoute } from '@/products/epinio/utils/custom-routing';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';

// TODO: RC DISCUSS Handle localisation in plugins

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    componentForType,
    virtualType
  } = DSL(store, EPINIO_PRODUCT_NAME);

  virtualType({
    label:       store.getters['i18n/t']('clusterIndexPage.header'),
    namespaced:  false,
    name:        'cluster-dashboard',
    weight:      1000,
    route:       createEpinioRoute('c-cluster'),
    exact:       true,
  });

  product({
    // ifHaveType:          CAPI.RANCHER_CLUSTER,
    // ifFeature:           MULTI_CLUSTER,
    category:            EPINIO_PRODUCT_NAME,
    isMultiClusterApp:   true,
    inStore:             EPINIO_PRODUCT_NAME,
    icon:                'dock',
    iconHeader:          require(`@/products/epinio/assets/epinio.png`),
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootEpinioRoute()
  });

  configureType(EPINIO_TYPES.INSTANCE, { customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.INSTANCE }) });

  componentForType(EPINIO_TYPES.APP, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.APP, {
    isCreatable:          true,
    isEditable:           true,
    isRemovable:          true,
    showState:            false,
    showAge:              false,
    canYaml:              false,
    resourceEditMasthead: false,
    customRoute:          createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.APP }),
  });

  componentForType(EPINIO_TYPES.NAMESPACE, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.NAMESPACE, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showState:   false,
    showAge:     false,
    canYaml:     false,
    customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.NAMESPACE }),
  });

  basicType([
    'cluster-dashboard',
    EPINIO_TYPES.APP,
    EPINIO_TYPES.NAMESPACE
  ]);

  headers(EPINIO_TYPES.APP, [
    STATE,
    NAME, {
    //   name:     'active',
    //   labelKey: 'epinio.tableHeaders.active',
    //   value:    'active',
    //   sort:     ['active'],
    // }, {
      name:          'namespace',
      labelKey:      'epinio.tableHeaders.organization',
      value:         'namespace',
      sort:          ['namespace'],
      formatter:     'LinkDetail',
      formatterOpts: { reference: 'nsLocation' }
    }, {
    //   name:     'username',
    //   labelKey: 'epinio.tableHeaders.username',
    //   value:    'username',
    //   sort:     ['username'],
    // }, {
    //   name:     'status',
    //   labelKey: 'epinio.tableHeaders.status',
    //   value:    'status',
    //   sort:     ['status'],
    // }, {
      name:      'route',
      labelKey:  'epinio.tableHeaders.route',
      value:     'routeLocation',
      sort:      ['route'],
      formatter:     'Link',
    }, {
      name:      'services',
      labelKey:  'epinio.tableHeaders.boundServices',
      value:     'bound_services',
      sort:      ['bound_services'],
      // formatter:     'List', // TODO: RC bound_services is somehow an empty string... rather than undefined
    },
  ]);

  headers(EPINIO_TYPES.NAMESPACE, [
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
