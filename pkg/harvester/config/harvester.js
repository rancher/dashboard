import {
  NODE, CONFIG_MAP, NAMESPACE, VIRTUAL_TYPES, MANAGEMENT, PVC, NETWORK_ATTACHMENT
} from '@shell/config/types';
import { HCI } from '../types.ts';
import {
  STATE, NAME_UNLINKED, NAME as NAME_COL, AGE, NAMESPACE as NAMESPACE_COL,
} from '@shell/config/table-headers';

import { IMAGE_DOWNLOAD_SIZE, FINGERPRINT, IMAGE_PROGRESS } from '@shell/config/harvester-table-headers';

import { IF_HAVE } from '@shell/store/type-map';

export const NAME = 'harvester';

const TEMPLATE = HCI.VM_VERSION;

export function init($plugin, store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    virtualType,
  } = $plugin.DSL(store, NAME);

  const isSingleVirtualCluster = store.getters['isSingleVirtualCluster'];

  // if (isSingleVirtualCluster) {
  store.dispatch('setIsSingleProduct', {
    logo:                require(`@shell/assets/images/providers/harvester.svg`),
    productNameKey:      'product.harvester',
    version:         store.getters['harvester/byId'](HCI.SETTING, 'server-version')?.value,
    afterLoginRoute: {
      name:   'harvester-c-cluster',
      params: { product: NAME },
    },
    logoRoute: {
      name:   'harvester-c-cluster-resource',
      params: {
        product:  NAME,
        resource: HCI.DASHBOARD,
      }
    }
  });
  // }

  product({
    inStore:             'harvester',
    removable:           false,
    showNamespaceFilter: true,
    hideKubeShell:       true,
    hideKubeConfig:      true,
    showClusterSwitcher: true,
    hideCopyConfig:      true,
    typeStoreMap:        {
      [MANAGEMENT.PROJECT]:                       'management',
      [MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING]: 'management',
      [MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING]: 'management'
    }
  });

  basicType([HCI.DASHBOARD]);
  virtualType({
    labelKey:     'harvester.dashboard.label',
    group:        'Root',
    name:         HCI.DASHBOARD,
    weight:       500,
    route:        {
      name:   'harvester-c-cluster-resource',
      params:  {
        product:  NAME,
        resource: HCI.DASHBOARD,
      },
    },
  });
  configureType(HCI.DASHBOARD, { showListMasthead: false });

  configureType(HCI.HOST, {
    location:    {
      name:    'harvester-c-cluster-resource',
      params:  { resource: HCI.HOST },
    },
    resource:       NODE,
    resourceDetail: HCI.HOST,
    resourceEdit:   HCI.HOST,
  });

  configureType(HCI.HOST, { isCreatable: false, isEditable: true });
  basicType([HCI.HOST]);

  virtualType({
    ifHaveType:    NODE,
    labelKey:     'harvester.host.label',
    group:        'Root',
    name:         HCI.HOST,
    namespaced:   true,
    weight:       399,
    route:        {
      name:   'harvester-c-cluster-resource',
      params: { resource: HCI.HOST }
    },
    exact: false,
  });

  // multiVirtualCluster
  basicType([
    'cluster-members',
  ], 'rbac');
  virtualType({
    ifHave:     IF_HAVE.MULTI_CLUSTER,
    labelKey:   'members.clusterMembers',
    group:      'root',
    namespaced:  false,
    name:        VIRTUAL_TYPES.CLUSTER_MEMBERS,
    weight:      100,
    route:       { name: 'harvester-c-cluster-members' },
    exact:       true,
    ifHaveType:  {
      type:   MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      store: 'management'
    }
  });

  basicType([HCI.VM]);
  virtualType({
    labelKey:   'harvester.virtualMachine.label',
    group:      'root',
    name:       HCI.VM,
    namespaced:  true,
    weight:     299,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.VM }
    },
    exact: false,
  });

  basicType([HCI.VOLUME]);
  configureType(HCI.VOLUME, {
    location:    {
      name:    'harvester-c-cluster-resource',
      params:  { resource: HCI.VOLUME },
    },
    resource:       PVC,
    resourceDetail: HCI.VOLUME,
    resourceEdit:   HCI.VOLUME,
  });
  virtualType({
    labelKey:   'harvester.volume.label',
    group:      'root',
    ifHaveType: PVC,
    name:       HCI.VOLUME,
    namespaced:  true,
    weight:     199,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.VOLUME }
    },
    exact: false,
  });

  basicType([HCI.IMAGE]);
  headers(HCI.IMAGE, [STATE, NAME_COL, NAMESPACE_COL, IMAGE_PROGRESS, IMAGE_DOWNLOAD_SIZE, AGE]);
  virtualType({
    labelKey:   'harvester.image.label',
    group:      'root',
    name:       HCI.IMAGE,
    namespaced:  true,
    weight:     99,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.IMAGE }
    },
    exact: false,
  });

  basicType(['projects-namespaces']);
  virtualType({
    ifHave:           IF_HAVE.MULTI_CLUSTER,
    labelKey:         'harvester.projectNamespace.label',
    group:            'root',
    namespaced:       true,
    name:             'projects-namespaces',
    weight:           98,
    route:            { name: 'c-cluster-product-projectsnamespaces' },
    exact:            true,
  });

  // singleVirtualCluster
  headers(NAMESPACE, [STATE, NAME_UNLINKED, AGE]);
  basicType([NAMESPACE]);
  virtualType({
    ifHave:                 IF_HAVE.HARVESTER_SINGLE_CLUSTER,
    labelKey:               'harvester.namespace.label',
    name:                   NAMESPACE,
    namespaced:             true,
    weight:                 89,
    route:                  {
      name:   'harvester-c-cluster-resource',
      params: { resource: NAMESPACE }
    },
    exact: false,
  });

  basicType([
    TEMPLATE,
    HCI.NETWORK_ATTACHMENT,
    HCI.BACKUP,
    HCI.SSH,
    HCI.CLOUD_TEMPLATE,
    HCI.SETTING
  ], 'advanced');

  configureType(HCI.CLUSTER_NETWORK, { realResource: HCI.SETTING, showState: false });

  configureType(HCI.MANAGED_CHART, {
    location:    {
      name:    'harvester-c-cluster-resource',
      params:  { resource: HCI.MANAGED_CHART },
    },
    resource:       MANAGEMENT.MANAGED_CHART,
    resourceDetail: HCI.MANAGED_CHART,
    resourceEdit:   HCI.MANAGED_CHART
  });

  configureType(MANAGEMENT.MANAGED_CHART, { showState: false });

  virtualType({
    labelKey:   'harvester.vmTemplate.label',
    group:      'root',
    name:       TEMPLATE,
    namespaced:  true,
    weight:     289,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: TEMPLATE }
    },
    exact: false,
  });

  configureType(HCI.BACKUP, { showListMasthead: false, showConfigView: false });
  virtualType({
    labelKey:   'harvester.backup.label',
    name:       HCI.BACKUP,
    namespaced:  true,
    weight:     200,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.BACKUP }
    },
    exact: false,
  });

  configureType(NETWORK_ATTACHMENT, { isEditable: false, showState: false });
  configureType(HCI.NETWORK_ATTACHMENT, {
    location:    {
      name:    'harvester-c-cluster-resource',
      params:  { resource: HCI.NETWORK_ATTACHMENT },
    },
    resource:       NETWORK_ATTACHMENT,
    resourceDetail: HCI.NETWORK_ATTACHMENT,
    resourceEdit:   HCI.NETWORK_ATTACHMENT,
  });

  virtualType({
    labelKey:   'harvester.network.label',
    name:       HCI.NETWORK_ATTACHMENT,
    namespaced:  true,
    weight:     189,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.NETWORK_ATTACHMENT }
    },
    exact: false,
  });

  headers(HCI.SSH, [STATE, NAME_COL, NAMESPACE_COL, FINGERPRINT, AGE]);
  virtualType({
    labelKey:   'harvester.sshKey.label',
    name:       HCI.SSH,
    namespaced:  true,
    weight:     170,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.SSH }
    },
    exact: false,
  });

  configureType(HCI.CLOUD_TEMPLATE, {
    location:    {
      name:    'harvester-c-cluster-resource',
      params:  { resource: HCI.CLOUD_TEMPLATE },
    },
    resource:       CONFIG_MAP,
    resourceDetail: HCI.CLOUD_TEMPLATE,
    resourceEdit:   HCI.CLOUD_TEMPLATE,
  });

  virtualType({
    labelKey:     'harvester.cloudTemplate.label',
    name:         HCI.CLOUD_TEMPLATE,
    namespaced:   true,
    weight:       87,
    route:        {
      name:      'harvester-c-cluster-resource',
      params:    { resource: HCI.CLOUD_TEMPLATE }
    },
    exact: false,
  });

  // settings
  configureType(HCI.SETTING, { isCreatable: false });
  virtualType({
    ifHaveType:          HCI.SETTING,
    ifHaveVerb:          'POST',
    labelKey:   'harvester.setting.label',
    name:       HCI.SETTING,
    namespaced: true,
    weight:     -1,
    route:      {
      name:     'harvester-c-cluster-resource',
      params:   { resource: HCI.SETTING }
    },
    exact: false
  });
}
