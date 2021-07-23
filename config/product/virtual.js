import {
  HCI, NODE, CONFIG_MAP, VIRTUAL_TYPES, MANAGEMENT
} from '@/config/types';
import {
  STATE, NAME as NAME_COL, AGE, NAMESPACE, IMAGE_DOWNLOAD_SIZE,
  FINGERPRINT
} from '@/config/table-headers';

import { DSL } from '@/store/type-map';

export const NAME = 'virtual';

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
    inStore:             'virtual',
    removable:           false,
    showNamespaceFilter: true,
    showClusterSwitcher: false,
    icon:                'compass'
  });

  basicType([HCI.DASHBOARD]);
  virtualType({
    label:         store.getters['i18n/t']('harvester.dashboard.label'),
    group:        'Root',
    labelDisplay: 'harvester.nav.dashboard',
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
    labelDisplay: 'harvester.typeLabel.host',
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
    group:      'rbac',
    namespaced:  false,
    name:        VIRTUAL_TYPES.CLUSTER_MEMBERS,
    icon:       'globe',
    weight:      100,
    route:       { name: 'c-cluster-virtual-members' },
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

  basicType([HCI.DATA_VOLUME]);
  virtualType({
    label:      store.getters['i18n/t']('harvester.volume.label'),
    group:      'root',
    name:       HCI.DATA_VOLUME,
    namespaced:  true,
    weight:     199,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: HCI.DATA_VOLUME }
    },
    exact: false,
  });

  basicType([HCI.IMAGE]);
  headers(HCI.IMAGE, [STATE, NAME_COL, NAMESPACE, /* IMAGE_PROGRESS, IMAGE_MESSAGE, */IMAGE_DOWNLOAD_SIZE, AGE]);
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

  basicType([
    TEMPLATE,
    HCI.NETWORK_ATTACHMENT,
    HCI.BACKUP,
    HCI.SSH,
    CLOUD_TEMPLATE,
    HCI.SETTING
  ], 'advanced');

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

  configureType(HCI.BACKUP, {
    DisableEditInDetail: true,
    showListMasthead:    false
  });
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

  headers(HCI.SSH, [STATE, NAME_COL, NAMESPACE, FINGERPRINT, AGE]);
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
    labelDisplay: 'harvester.typeLabel.host',
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
    ifHaveType: HCI.SETTING,
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
