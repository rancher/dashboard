import {
  HCI, NODE, CONFIG_MAP, NAMESPACE, VIRTUAL_TYPES, MANAGEMENT, PVC
} from '@/config/types';
import {
  STATE, NAME_UNLINKED, NAME as NAME_COL, AGE, NAMESPACE_COL,
} from '@/config/table-headers';

import { IMAGE_DOWNLOAD_SIZE, FINGERPRINT, IMAGE_PROGRESS } from '@/config/harvester-table-headers';

import { DSL } from '@/store/type-map';

export const NAME = 'harvester';

const TEMPLATE = HCI.VM_VERSION;
const CLOUD_TEMPLATE = 'cloudTemplate';
const HOST = 'host';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    virtualType,
  } = DSL(store, NAME);

  product({
    inStore:             'harvester',
    removable:           false,
    showNamespaceFilter: true,
    showClusterSwitcher: true,
    typeStoreMap:        {
      [MANAGEMENT.PROJECT]:                       'management',
      [MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING]: 'management',
      [MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING]: 'management'
    }
  });

  basicType([HCI.DASHBOARD]);
  virtualType({
    label:         store.getters['i18n/t']('harvester.dashboard.label'),
    group:        'Root',
    name:         HCI.DASHBOARD,
    weight:       500,
    route:        {
      name:   'c-cluster-product-resource',
      params:  {
        product:  NAME,
        resource: HCI.DASHBOARD,
      },
    },
  });
  configureType(HCI.DASHBOARD, { showListMasthead: false });

  configureType(HOST, {
    location:    {
      name:    'c-cluster-product-resource',
      params:  { resource: HOST },
    },
    resource:          NODE,
    useCustomInImport: true
  });

  configureType(HOST, { isCreatable: false, isEditable: true });
  basicType([HOST]);
  virtualType({
    ifHaveType:    NODE,
    label:         store.getters['i18n/t']('harvester.host.label'),
    group:        'Root',
    name:         HOST,
    namespaced:   true,
    weight:       399,
    route:        {
      name:   'c-cluster-product-resource',
      params: { resource: HOST }
    },
    exact: false,
  });

  // multiVirtualCluster
  basicType([
    'cluster-members',
  ], 'rbac');
  virtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootGetters['isMultiCluster'];
    },
    label:       store.getters['i18n/t']('members.clusterMembers'),
    group:      'root',
    namespaced:  false,
    name:        VIRTUAL_TYPES.CLUSTER_MEMBERS,
    weight:      100,
    route:       { name: 'c-cluster-product-members' },
    exact:       true,
    ifHaveType:  {
      type:   MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      store: 'management'
    }
  });

  basicType([HCI.VM]);
  virtualType({
    label:      store.getters['i18n/t']('harvester.virtualMachine.label'),
    group:      'root',
    name:       HCI.VM,
    namespaced:  true,
    weight:     299,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.VM }
    },
    exact: false,
  });

  basicType([HCI.VOLUME]);
  configureType(HCI.VOLUME, {
    location:    {
      name:    'c-cluster-product-resource',
      params:  { resource: HCI.VOLUME },
    },
    resource:          PVC,
    useCustomInImport: true
  });
  virtualType({
    label:      store.getters['i18n/t']('harvester.volume.label'),
    group:      'root',
    ifHaveType: PVC,
    name:       HCI.VOLUME,
    namespaced:  true,
    weight:     199,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.VOLUME }
    },
    exact: false,
  });

  basicType([HCI.IMAGE]);
  headers(HCI.IMAGE, [STATE, NAME_COL, NAMESPACE_COL, IMAGE_PROGRESS, IMAGE_DOWNLOAD_SIZE, AGE]);
  virtualType({
    label:      store.getters['i18n/t']('harvester.image.label'),
    group:      'root',
    name:       HCI.IMAGE,
    namespaced:  true,
    weight:     99,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.IMAGE }
    },
    exact: false,
  });

  basicType(['projects-namespaces']);
  virtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootGetters['isMultiCluster'];
    },
    label:            'Projects/Namespaces',
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
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootGetters['isSingleVirtualCluster'];
    },
    label:                  store.getters['i18n/t'](`typeLabel.${ NAMESPACE }`, { count: 2 }),
    name:                   NAMESPACE,
    namespaced:             true,
    weight:                 89,
    route:                  {
      name:   'c-cluster-product-resource',
      params: { resource: NAMESPACE }
    },
    exact: false,
  });

  basicType([
    TEMPLATE,
    HCI.NETWORK_ATTACHMENT,
    HCI.BACKUP,
    HCI.SSH,
    CLOUD_TEMPLATE,
    HCI.SETTING
  ], 'Advanced');

  configureType(HCI.CLUSTER_NETWORK, { realResource: HCI.SETTING, showState: false });
  virtualType({
    label:      store.getters['i18n/t']('harvester.vmTemplate.label'),
    group:      'root',
    name:       TEMPLATE,
    namespaced:  true,
    weight:     289,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: TEMPLATE }
    },
    exact: false,
  });

  configureType(HCI.BACKUP, { showListMasthead: false });
  virtualType({
    label:      store.getters['i18n/t']('harvester.backup.label'),
    name:       HCI.BACKUP,
    namespaced:  true,
    weight:     200,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.BACKUP }
    },
    exact: false,
  });

  configureType(HCI.NETWORK_ATTACHMENT, { isEditable: false, showState: false });
  virtualType({
    label:      store.getters['i18n/t']('harvester.network.label'),
    name:       HCI.NETWORK_ATTACHMENT,
    namespaced:  true,
    weight:     189,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.NETWORK_ATTACHMENT }
    },
    exact: false,
  });

  headers(HCI.SSH, [STATE, NAME_COL, NAMESPACE_COL, FINGERPRINT, AGE]);
  virtualType({
    label:      store.getters['i18n/t']('harvester.sshKey.label'),
    name:       HCI.SSH,
    namespaced:  true,
    weight:     170,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.SSH }
    },
    exact: false,
  });

  configureType(CLOUD_TEMPLATE, {
    location:    {
      name:    'c-cluster-product-resource',
      params:  { resource: CLOUD_TEMPLATE },
    },
    resource:          CONFIG_MAP,
    useCustomInImport: true
  });
  virtualType({
    label:        store.getters['i18n/t']('harvester.cloudTemplate.label'),
    name:         CLOUD_TEMPLATE,
    namespaced:   true,
    weight:       87,
    route:        {
      name:      'c-cluster-product-resource',
      params:    { resource: CLOUD_TEMPLATE }
    },
    exact: false,
  });

  // settings
  configureType(HCI.SETTING, { isCreatable: false });
  virtualType({
    showMenuFun(state, getters, rootState, rootGetters, out) {
      const schema = rootGetters['harvester/schemaFor'](HCI.SETTING);

      if (schema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
        return true;
      }
      // TODO: use cb
      delete out[HCI.SETTING];

      return false;
    },
    label:      store.getters['i18n/t']('harvester.setting.label'),
    name:       HCI.SETTING,
    namespaced: true,
    weight:     -1,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.SETTING }
    },
    exact: false
  });
}
