import { NAME, SIMPLE_NAME, STATE } from '@/config/table-headers';
import { DSL } from '@/store/type-map';
import { createEpinioRoute, rootEpinioRoute } from '@/products/epinio/utils/custom-routing';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';
import EpinioDiscovery from '@/products/epinio/utils/epinio-discovery';
import { MULTI_CLUSTER } from '@/store/features';

// TODO: RC rename `/pp/v1` --> `/
// TODO: RC check steve/action request how add prefix?

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

  // TODO: RC this needs to be conditional on an env (tie in to Phil's new env?)
  const isSingleProduct = true;
  // TODO: RC this needs to come from an env (tie in to Phil's new env?)
  const version = `0.3.6`;

  if (isSingleProduct) {
    store.dispatch('setIsSingleProduct', {
      logo:                require(`@/products/epinio/assets/logo-epinio.svg`),
      productNameKey:      'epinio.label',
      version,
      afterLoginRoute:     createEpinioRoute('c-cluster-applications', { cluster: 'default' }),
      logoRoute:           createEpinioRoute('c-cluster-applications', { cluster: 'default' }),
      disableSteveSockets: true,
    });
  }

  product({
    // ifHaveType:          CAPI.RANCHER_CLUSTER,
    ifFeature:             MULTI_CLUSTER,
    category:              EPINIO_PRODUCT_NAME,
    isMultiClusterApp:     true,
    inStore:               EPINIO_PRODUCT_NAME,
    icon:                  'epinio',
    iconHeader:            isSingleProduct ? undefined : require(`@/products/epinio/assets/logo-epinio.svg`),
    removable:             false,
    showClusterSwitcher:   false,
    to:                    rootEpinioRoute(),
    showNamespaceFilter:   true,
    customNamespaceFilter: true,
  });

  // Internal Types
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
    getInstances: async() => await EpinioDiscovery.discover(store),
  });
  configureType(EPINIO_TYPES.INSTANCE, {
    isCreatable:          false,
    isEditable:           false,
    isRemovable:          false,
    showState:            false,
    showAge:              false,
    canYaml:              false,
  });
  configureType(EPINIO_TYPES.INSTANCE, { customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.INSTANCE }) });
  componentForType(EPINIO_TYPES.APP_ACTION, undefined, EPINIO_PRODUCT_NAME);

  // App resource
  weightType(EPINIO_TYPES.APP, 300, true);
  componentForType(EPINIO_TYPES.APP, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.APP, {
    isCreatable:          true,
    isEditable:           true,
    isRemovable:          true,
    showState:            true,
    showAge:              false,
    canYaml:              false,
    customRoute:          createEpinioRoute('c-cluster-applications', { }),
  });

  // Service resource
  weightType(EPINIO_TYPES.SERVICE, 200, true);
  componentForType(EPINIO_TYPES.SERVICE, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.SERVICE, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showState:   false,
    showAge:     false,
    canYaml:     false,
    customRoute: createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.SERVICE }),
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
    EPINIO_TYPES.SERVICE
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
      labelKey:  'epinio.applications.tableHeaders.route',
      search:      ['configuration.route'],
    },
    {
      name:      'services',
      labelKey:  'epinio.applications.tableHeaders.boundServices',
      search:    ['configuration.services'],
    },
    {
      name:     'deployedBy',
      labelKey: 'epinio.applications.tableHeaders.deployedBy',
      value:    'deployment.username',
      sort:     ['deployment.username'],
    }
  ]);

  headers(EPINIO_TYPES.NAMESPACE, [
    SIMPLE_NAME,
    {
      name:      'applications',
      labelKey:  'epinio.namespace.tableHeaders.appCount',
      value:     'appCount',
      sort:      ['appCount'],
    },
    {
      name:      'services',
      labelKey:  'epinio.namespace.tableHeaders.serviceCount',
      value:     'serviceCount',
      sort:      ['serviceCount'],
    },
  ]);

  headers(EPINIO_TYPES.INSTANCE, [
    STATE,
    {
      name:          'name',
      labelKey:      'tableHeaders.simpleName',
      sort:     ['name'],
    },
    {
      name:      'api',
      labelKey:  'epinio.instances.tableHeaders.api',
      sort:      ['api'],
    },
  ]);

  headers(EPINIO_TYPES.SERVICE, [
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
      name:      'boundApps',
      labelKey:  'epinio.services.tableHeaders.boundApps',
      search:    ['configuration.boundapps'],
    },
    {
      name:      'count',
      labelKey:  'epinio.services.tableHeaders.variableCount',
      value:     'variableCount',
      sort:      ['variableCount'],
    },
    {
      name:      'createdBy',
      labelKey:  'epinio.services.tableHeaders.createBy',
      value:     'configuration.user',
      sort:      ['configuration.user'],
    },
  ]);
}
