import { NAME, SIMPLE_NAME, STATE } from '@/config/table-headers';
import { DSL } from '@/store/type-map';
import { createEpinioRoute, rootEpinioRoute } from '@/products/epinio/utils/custom-routing';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';
import EpinioDiscovery from '@/products/epinio/utils/epinio-discovery';

// TODO: RC DISCUSS Handle localisation in plugins

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    componentForType,
    virtualType,
    spoofedType
  } = DSL(store, EPINIO_PRODUCT_NAME);

  virtualType({
    label:       store.getters['i18n/t']('clusterIndexPage.header'),
    namespaced:  false,
    name:        'cluster-dashboard',
    weight:      1000,
    route:       createEpinioRoute('c-cluster'),
    exact:       true,
  });

  spoofedType({
    label:             store.getters['type-map/labelFor']({ id: EPINIO_TYPES.INSTANCE }, 2),
    type:              EPINIO_TYPES.INSTANCE,
    product:           EPINIO_PRODUCT_NAME,
    collectionMethods: [],
    schemas:           [
      {
        id:                EPINIO_TYPES.INSTANCE,
        type:              'schema',
        collectionMethods: [],
        resourceFields:    {},
      }
    ],
    getInstances: async() => {
      return await EpinioDiscovery.discover(store);
    }
  });
  configureType(EPINIO_TYPES.INSTANCE, {
    isCreatable:          false,
    isEditable:           false,
    isRemovable:          false,
    showState:            false,
    showAge:              false,
    canYaml:              false,
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
    EPINIO_TYPES.NAMESPACE,
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
      labelKey:      'epinio.tableHeaders.namespace',
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
      labelKey: 'epinio.instances.api',
      value:    'api',
      sort:     ['api'],
    },
    {
      name:     'pick',
      labelKey: 'epinio.instances.explore',
    }
  ]);
}
