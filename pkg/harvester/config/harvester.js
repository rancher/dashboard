import { _EDIT, MODE } from '@shell/config/query-params';
import {
  NODE,
  CONFIG_MAP,
  NAMESPACE,
  VIRTUAL_TYPES,
  MANAGEMENT,
  PVC,
  NETWORK_ATTACHMENT,
  MONITORING,
  LOGGING,
  STORAGE_CLASS,
} from '@shell/config/types';
import { HCI, VOLUME_SNAPSHOT } from '../types';
import {
  STATE,
  NAME_UNLINKED,
  NAME as NAME_COL,
  AGE,
  NAMESPACE as NAMESPACE_COL,
  LOGGING_OUTPUT_PROVIDERS,
  OUTPUT,
  CLUSTER_OUTPUT,
  CONFIGURED_PROVIDERS
} from '@shell/config/table-headers';

import {
  IMAGE_DOWNLOAD_SIZE,
  FINGERPRINT,
  IMAGE_PROGRESS,
  SNAPSHOT_TARGET_VOLUME,
} from './table-headers';

import { IF_HAVE } from '@shell/store/type-map';

const TEMPLATE = HCI.VM_VERSION;
const MONITORING_GROUP = 'Monitoring & Logging::Monitoring';
const LOGGING_GROUP = 'Monitoring & Logging::Logging';
const MONITORING_CONFIGURATION = 'monitoring-configuration';
const LOGGING_CONFIGURATION = 'logging-configuration';

export const PRODUCT_NAME = 'harvester';

export function init($plugin, store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    virtualType,
    weightGroup,
  } = $plugin.DSL(store, PRODUCT_NAME);

  const isSingleVirtualCluster = process.env.rancherEnv === PRODUCT_NAME;

  if (isSingleVirtualCluster) {
    const home = {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        resource: HCI.DASHBOARD
      }
    };

    store.dispatch('setIsSingleProduct', {
      logo:            require(`@shell/assets/images/providers/harvester.svg`),
      productNameKey:  'harvester.productLabel',
      getVersionInfo:  store => store.getters[`${ PRODUCT_NAME }/byId`](HCI.SETTING, 'server-version')?.value || 'unknown',
      afterLoginRoute: home,
      logoRoute:       home
    });
  }

  product({
    inStore:             PRODUCT_NAME,
    removable:           false,
    showNamespaceFilter: true,
    hideKubeShell:       true,
    hideKubeConfig:      true,
    showClusterSwitcher: true,
    hideCopyConfig:      true,
    hideSystemResources: true,
    typeStoreMap:        {
      [MANAGEMENT.PROJECT]:                       'management',
      [MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING]: 'management',
      [MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING]: 'management'
    },
    supportRoute: { name: `${ PRODUCT_NAME }-c-cluster-support` },
    to:           {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        resource: HCI.DASHBOARD
      }
    }
  });

  basicType([HCI.DASHBOARD]);
  virtualType({
    labelKey: 'harvester.dashboard.label',
    group:    'Root',
    name:     HCI.DASHBOARD,
    weight:   500,
    route:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        resource: HCI.DASHBOARD
      }
    }
  });
  configureType(HCI.DASHBOARD, { showListMasthead: false });

  configureType(HCI.HOST, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.HOST }
    },
    resource:       NODE,
    resourceDetail: HCI.HOST,
    resourceEdit:   HCI.HOST
  });

  configureType(HCI.HOST, { isCreatable: false, isEditable: true });
  basicType([HCI.HOST]);

  virtualType({
    ifHaveType: NODE,
    labelKey:   'harvester.host.label',
    group:      'Root',
    name:       HCI.HOST,
    namespaced: true,
    weight:     399,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.HOST }
    },
    exact: false
  });

  // multiVirtualCluster
  basicType(['cluster-members'], 'rbac');
  virtualType({
    ifHave:     IF_HAVE.MULTI_CLUSTER,
    labelKey:   'members.clusterMembers',
    group:      'root',
    namespaced: false,
    name:       VIRTUAL_TYPES.CLUSTER_MEMBERS,
    weight:     100,
    route:      { name: `${ PRODUCT_NAME }-c-cluster-members` },
    exact:      true,
    ifHaveType: {
      type:  MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      store: 'management'
    }
  });

  basicType([HCI.VM]);
  virtualType({
    labelKey:   'harvester.virtualMachine.label',
    group:      'root',
    name:       HCI.VM,
    namespaced: true,
    weight:     299,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VM }
    },
    exact: false
  });

  basicType([HCI.VOLUME]);
  configureType(HCI.VOLUME, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VOLUME }
    },
    resource:       PVC,
    resourceDetail: HCI.VOLUME,
    resourceEdit:   HCI.VOLUME
  });
  virtualType({
    labelKey:   'harvester.volume.label',
    group:      'root',
    ifHaveType: PVC,
    name:       HCI.VOLUME,
    namespaced: true,
    weight:     199,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VOLUME }
    },
    exact: false
  });

  basicType([HCI.IMAGE]);
  headers(HCI.IMAGE, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    IMAGE_PROGRESS,
    IMAGE_DOWNLOAD_SIZE,
    AGE
  ]);
  virtualType({
    labelKey:   'harvester.image.label',
    group:      'root',
    name:       HCI.IMAGE,
    namespaced: true,
    weight:     99,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.IMAGE }
    },
    exact: false
  });

  basicType(['projects-namespaces']);
  virtualType({
    ifHave:     IF_HAVE.MULTI_CLUSTER,
    labelKey:   'harvester.projectNamespace.label',
    group:      'root',
    namespaced: true,
    name:       'projects-namespaces',
    weight:     98,
    route:      { name: `${ PRODUCT_NAME }-c-cluster-projectsnamespaces` },
    exact:      true
  });

  // singleVirtualCluster
  if (isSingleVirtualCluster) {
    headers(NAMESPACE, [STATE, NAME_UNLINKED, AGE]);
    basicType([NAMESPACE]);
    virtualType({
      labelKey:   'harvester.namespace.label',
      name:       NAMESPACE,
      namespaced: true,
      weight:     89,
      route:      {
        name:   `${ PRODUCT_NAME }-c-cluster-resource`,
        params: { resource: NAMESPACE }
      },
      exact: false
    });
  }

  basicType([
    MONITORING_CONFIGURATION,
    HCI.ALERTMANAGERCONFIG
  ], MONITORING_GROUP);

  basicType([
    LOGGING_CONFIGURATION,
    HCI.CLUSTER_FLOW,
    HCI.CLUSTER_OUTPUT,
    HCI.FLOW,
    HCI.OUTPUT,
  ], LOGGING_GROUP);

  weightGroup('Monitoring', 2, true);
  weightGroup('Logging', 1, true);

  virtualType({
    ifHaveType:    MANAGEMENT.MANAGED_CHART,
    labelKey:     'harvester.monitoring.configuration.label',
    name:         MONITORING_CONFIGURATION,
    namespaced:   true,
    weight:       88,
    route:        {
      name:      `${ PRODUCT_NAME }-c-cluster-resource-namespace-id`,
      params:    {
        resource: HCI.MANAGED_CHART, namespace: 'fleet-local', id: 'rancher-monitoring'
      },
      query: { [MODE]: _EDIT }
    },
    exact: false,
  });

  virtualType({
    ifHaveType:    MANAGEMENT.MANAGED_CHART,
    labelKey:     'harvester.monitoring.configuration.label',
    name:         LOGGING_CONFIGURATION,
    namespaced:   true,
    weight:       88,
    route:        {
      name:      `${ PRODUCT_NAME }-c-cluster-resource-namespace-id`,
      params:    {
        resource: HCI.MANAGED_CHART, namespace: 'fleet-local', id: 'rancher-logging'
      },
      query: { [MODE]: _EDIT }
    },
    exact: false,
  });

  headers(HCI.ALERTMANAGERCONFIG, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    {
      name:      'receivers',
      labelKey:  'tableHeaders.receivers',
      formatter: 'ReceiverIcons',
      value:     'name'
    },
  ]);

  configureType(HCI.ALERTMANAGERCONFIG, {
    location:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:  { resource: HCI.ALERTMANAGERCONFIG },
    },
    resource:       MONITORING.ALERTMANAGERCONFIG,
    resourceDetail: HCI.ALERTMANAGERCONFIG,
    resourceEdit:   HCI.ALERTMANAGERCONFIG
  });

  virtualType({
    ifHaveType:    MONITORING.ALERTMANAGERCONFIG,
    labelKey:     'harvester.monitoring.alertmanagerConfig.label',
    name:         HCI.ALERTMANAGERCONFIG,
    namespaced:   true,
    weight:       87,
    route:        {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.ALERTMANAGERCONFIG }
    },
    exact: false,
  });

  configureType(HCI.CLUSTER_FLOW, {
    location:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:  { resource: HCI.CLUSTER_FLOW },
    },
    resource:       LOGGING.CLUSTER_FLOW,
    resourceDetail: HCI.CLUSTER_FLOW,
    resourceEdit:   HCI.CLUSTER_FLOW
  });

  virtualType({
    ifHaveType:    LOGGING.CLUSTER_FLOW,
    labelKey:     'harvester.logging.clusterFlow.label',
    name:         HCI.CLUSTER_FLOW,
    namespaced:   true,
    weight:       79,
    route:        {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.CLUSTER_FLOW }
    },
    exact: false,
  });

  configureType(HCI.CLUSTER_OUTPUT, {
    location:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:  { resource: HCI.CLUSTER_OUTPUT },
    },
    resource:       LOGGING.CLUSTER_OUTPUT,
    resourceDetail: HCI.CLUSTER_OUTPUT,
    resourceEdit:   HCI.CLUSTER_OUTPUT
  });

  virtualType({
    ifHaveType:    LOGGING.CLUSTER_OUTPUT,
    labelKey:     'harvester.logging.clusterOutput.label',
    name:         HCI.CLUSTER_OUTPUT,
    namespaced:   true,
    weight:       78,
    route:        {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.CLUSTER_OUTPUT }
    },
    exact: false,
  });

  configureType(HCI.FLOW, {
    location:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:  { resource: HCI.FLOW },
    },
    resource:       LOGGING.FLOW,
    resourceDetail: HCI.FLOW,
    resourceEdit:   HCI.FLOW
  });

  virtualType({
    ifHaveType:    LOGGING.FLOW,
    labelKey:     'harvester.logging.flow.label',
    name:         HCI.FLOW,
    namespaced:   true,
    weight:       77,
    route:        {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.FLOW }
    },
    exact: false,
  });

  configureType(HCI.OUTPUT, {
    location:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:  { resource: HCI.OUTPUT },
    },
    resource:       LOGGING.OUTPUT,
    resourceDetail: HCI.OUTPUT,
    resourceEdit:   HCI.OUTPUT
  });

  virtualType({
    ifHaveType:    LOGGING.OUTPUT,
    labelKey:     'harvester.logging.output.label',
    name:         HCI.OUTPUT,
    namespaced:   true,
    weight:       76,
    route:        {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.OUTPUT }
    },
    exact: false,
  });

  headers(HCI.FLOW, [STATE, NAME_COL, NAMESPACE_COL, OUTPUT, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS, AGE]);
  headers(HCI.OUTPUT, [STATE, NAME_COL, NAMESPACE_COL, LOGGING_OUTPUT_PROVIDERS, AGE]);
  headers(HCI.CLUSTER_FLOW, [STATE, NAME_COL, NAMESPACE_COL, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS, AGE]);
  headers(HCI.CLUSTER_OUTPUT, [STATE, NAME_COL, NAMESPACE_COL, LOGGING_OUTPUT_PROVIDERS, AGE]);

  basicType(
    [
      HCI.VLAN_CONFIG,
      HCI.NETWORK_ATTACHMENT,
    ],
    'networks'
  );

  basicType(
    [
      TEMPLATE,
      HCI.BACKUP,
      HCI.SNAPSHOT,
      HCI.VM_SNAPSHOT,
      HCI.SSH,
      HCI.CLOUD_TEMPLATE,
      HCI.STORAGE,
      HCI.SETTING
    ],
    'advanced'
  );

  configureType(HCI.CLUSTER_NETWORK, {
    realResource: HCI.SETTING,
    showState:    false
  });

  configureType(HCI.MANAGED_CHART, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.MANAGED_CHART }
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
    namespaced: true,
    weight:     289,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: TEMPLATE }
    },
    exact: false
  });

  configureType(HCI.BACKUP, { showListMasthead: false, showConfigView: false });
  virtualType({
    labelKey:   'harvester.backup.label',
    name:       HCI.BACKUP,
    namespaced: true,
    weight:     200,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.BACKUP }
    },
    exact: false
  });

  headers(HCI.VLAN_CONFIG, [
    STATE,
    NAME_COL,
    {
      name:     'clusterNetwork',
      labelKey: 'harvester.network.clusterNetwork.label',
      value:    'spec.clusterNetwork',
      sort:     'spec.clusterNetwork',
    },
    AGE
  ]);
  virtualType({
    labelKey:   'harvester.vlanConfig.title',
    name:       HCI.VLAN_CONFIG,
    namespaced: false,
    weight:     190,
    route:      {
      name:     `${ PRODUCT_NAME }-c-cluster-resource`,
      params:   { resource: HCI.VLAN_CONFIG }
    },
    exact: false,
  });

  configureType(NETWORK_ATTACHMENT, { isEditable: false, showState: false });
  configureType(HCI.NETWORK_ATTACHMENT, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.NETWORK_ATTACHMENT }
    },
    resource:       NETWORK_ATTACHMENT,
    resourceDetail: HCI.NETWORK_ATTACHMENT,
    resourceEdit:   HCI.NETWORK_ATTACHMENT
  });

  virtualType({
    labelKey:   'harvester.network.label',
    name:       HCI.NETWORK_ATTACHMENT,
    namespaced: true,
    weight:     189,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.NETWORK_ATTACHMENT }
    },
    exact: false
  });

  configureType(HCI.SNAPSHOT, {
    isCreatable: false,
    location:    {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:  { resource: HCI.SNAPSHOT },
    },
    resource:       VOLUME_SNAPSHOT,
    resourceDetail: HCI.SNAPSHOT,
    resourceEdit:   HCI.SNAPSHOT,
  });
  headers(HCI.SNAPSHOT, [STATE, NAME_COL, NAMESPACE_COL, SNAPSHOT_TARGET_VOLUME, AGE]);
  virtualType({
    labelKey:     'harvester.snapshot.label',
    name:         HCI.SNAPSHOT,
    namespaced:   true,
    weight:       190,
    route:        {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params:    { resource: HCI.SNAPSHOT }
    },
    exact: false,
  });

  configureType(HCI.VM_SNAPSHOT, {
    showListMasthead: false,
    location:         {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VM_SNAPSHOT }
    },
    resource:       HCI.BACKUP,
    resourceDetail: HCI.VM_SNAPSHOT,
    resourceEdit:   HCI.VM_SNAPSHOT
  });

  virtualType({
    labelKey:   'harvester.vmSnapshot.label',
    name:       HCI.VM_SNAPSHOT,
    namespaced: true,
    weight:     191,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VM_SNAPSHOT }
    },
    exact: false
  });

  headers(HCI.SSH, [STATE, NAME_COL, NAMESPACE_COL, FINGERPRINT, AGE]);
  virtualType({
    labelKey:   'harvester.sshKey.label',
    name:       HCI.SSH,
    namespaced: true,
    weight:     170,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.SSH }
    },
    exact: false
  });

  configureType(HCI.CLOUD_TEMPLATE, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.CLOUD_TEMPLATE }
    },
    resource:       CONFIG_MAP,
    resourceDetail: HCI.CLOUD_TEMPLATE,
    resourceEdit:   HCI.CLOUD_TEMPLATE
  });

  virtualType({
    labelKey:   'harvester.cloudTemplate.label',
    name:       HCI.CLOUD_TEMPLATE,
    namespaced: true,
    weight:     87,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.CLOUD_TEMPLATE }
    },
    exact: false
  });

  // settings
  configureType(HCI.SETTING, { isCreatable: false });
  virtualType({
    ifHaveType: HCI.SETTING,
    ifHaveVerb: 'POST',
    labelKey:   'harvester.setting.label',
    name:       HCI.SETTING,
    namespaced: true,
    weight:     -1,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.SETTING }
    },
    exact: false
  });

  configureType(HCI.STORAGE, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.STORAGE }
    },
    resource:       STORAGE_CLASS,
    resourceDetail: HCI.STORAGE,
    resourceEdit:   HCI.STORAGE,
  });
  virtualType({
    labelKey:   'harvester.storage.title',
    group:      'root',
    ifHaveType: STORAGE_CLASS,
    name:       HCI.STORAGE,
    namespaced: false,
    weight:     79,
    route:      {
      name:     `${ PRODUCT_NAME }-c-cluster-resource`,
      params:   { resource: HCI.STORAGE }
    },
    exact: false,
  });

  basicType([HCI.PCI_DEVICE], 'advanced');

  virtualType({
    label:      'PCI Devices',
    group:      'advanced',
    name:       HCI.PCI_DEVICE,
    namespaced:  false,
    route:      {
      name:     `${ PRODUCT_NAME }-c-cluster-resource`,
      params:   { resource: HCI.PCI_DEVICE }
    },
    exact: false,
  });

  configureType(HCI.PCI_DEVICE, {
    listGroups: [
      {
        icon:       'icon-list-grouped',
        value:      'description',
        field:      'groupByDevice',
        hideColumn: 'description',
        tooltipKey: 'resourceTable.groupBy.device'
      },
      {
        icon:       'icon-cluster',
        value:      'node',
        field:      'groupByNode',
        hideColumn: 'node',
        tooltipKey: 'resourceTable.groupBy.node'
      }
    ]
  });
}
