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
    spoofedType,
    weightType
  } = DSL(store, EPINIO_PRODUCT_NAME);

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
    icon:                'epinio',
    iconHeader:          require(`@/products/epinio/assets/logo-epinio.svg`),
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootEpinioRoute()
  });

  // Internal Types
  configureType(EPINIO_TYPES.INSTANCE, { customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.INSTANCE }) });
  componentForType(EPINIO_TYPES.APP_ACTION, undefined, EPINIO_PRODUCT_NAME);

  // App resource
  weightType(EPINIO_TYPES.APP, 200, true);
  componentForType(EPINIO_TYPES.APP, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.APP, {
    isCreatable:          true,
    isEditable:           true,
    isRemovable:          true,
    showState:            false,
    showAge:              false,
    canYaml:              false,
    resourceEditMasthead: true, // TODO: RC REMOVE?
    customRoute:          createEpinioRoute('c-cluster-applications', { }),
  });

  // Namespace resource
  weightType(EPINIO_TYPES.NAMESPACE, 100, true);
  componentForType(EPINIO_TYPES.NAMESPACE, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.NAMESPACE, {
    isCreatable:      true,
    isEditable:       true,
    isRemovable:      true,
    showState:        false,
    showAge:          false,
    canYaml:          false,
    customRoute:      createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.NAMESPACE }),
    showListMasthead: false // Disable default masthead because we provide a custom one.
  });

  basicType([
    EPINIO_TYPES.APP,
    EPINIO_TYPES.NAMESPACE,
  ]);

  headers(EPINIO_TYPES.APP, [
    STATE,
    NAME,
    {
      name:          'namespace',
      labelKey:      'epinio.tableHeaders.namespace',
      value:         'meta.namespace',
      sort:          ['meta.namespace'],
      formatter:     'LinkDetail',
      formatterOpts: { reference: 'nsLocation' }
    },
    {
      name:     'dep-status',
      labelKey: 'tableHeaders.status',
      value:    'deployment.status',
      sort:     ['deployment.status'],
    },
    {
      name:      'route',
      labelKey:  'epinio.tableHeaders.route',
      value:     'routeLocation',
      sort:      ['route'],
      formatter: 'Link',
    },
    {
      name:      'services',
      labelKey:  'epinio.tableHeaders.boundServices',
      value:     'configuration.services',
      formatter: 'List',
    },
    {
      name:     'deployedBy',
      labelKey: 'epinio.tableHeaders.deployedBy',
      value:    'deployment.username',
      sort:     ['deployment.username'],
    }
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
