import Vue from 'vue';
import { get } from '@/utils/object';
import { DESCRIPTION } from '@/config/labels-annotations';
import { NORMAN } from '@/config/types';
import SteveModel from '@/plugins/steve/steve-class';
import Role from './rbac.authorization.k8s.io.role';

export const CATTLE_API_GROUP = '.cattle.io';

export const SUBTYPE_MAPPING = {
  GLOBAL:    {
    key:            'GLOBAL',
    type:           'management.cattle.io.globalrole',
    defaultKey:     'newUserDefault',
    id:             'GLOBAL',
    labelKey:          'rbac.roletemplate.subtypes.GLOBAL.label',
  },
  CLUSTER:   {
    key:            'CLUSTER',
    type:           'management.cattle.io.roletemplate',
    context:        'cluster',
    defaultKey:     'clusterCreatorDefault',
    id:             'CLUSTER',
    labelKey:          'rbac.roletemplate.subtypes.CLUSTER.label',
  },
  NAMESPACE: {
    key:            'NAMESPACE',
    type:           'management.cattle.io.roletemplate',
    context:        'project',
    defaultKey:     'projectCreatorDefault',
    id:             'NAMESPACE',
    labelKey:          'rbac.roletemplate.subtypes.NAMESPACE.label',
  },
  RBAC_ROLE: {
    key:            'RBAC_ROLE',
    type:           'rbac.authorization.k8s.io.role',
    id:             'RBAC_ROLE',
    labelKey:          'rbac.roletemplate.subtypes.RBAC_ROLE.label',
  },
  RBAC_CLUSTER_ROLE: {
    key:            'RBAC_CLUSTER_ROLE',
    type:           'rbac.authorization.k8s.io.clusterrole',
    id:             'RBAC_CLUSTER_ROLE',
    labelKey:          'rbac.roletemplate.subtypes.RBAC_CLUSTER_ROLE.label',
  }
};

export const VERBS = [
  'create',
  'delete',
  'get',
  'list',
  'patch',
  'update',
  'watch',
];

const RESOURCES = [
  'APIGroups',
  'APIServices',
  'Alertmanagers',
  'Apps',
  'AppRevisions',
  'AuthConfigs',
  'AuthorizationPolicies',
  'Bundles',
  'BundleDeployments',
  'BundleNamespaceMappings',
  'CSIDrivers',
  'CSINodes',
  'Catalogs',
  'CatalogTemplates',
  'CatalogTemplateVersions',
  'Certificates',
  'CertificateRequests',
  'CertificateSigningRequests',
  'Challenges',
  'CisBenchmarkVersions',
  'CisConfigs',
  'Clusters',
  'ClusterAlerts',
  'ClusterAlertGroups',
  'ClusterAlertRules',
  'ClusterCatalogs',
  'ClusterFlows',
  'ClusterGroups',
  'ClusterIssuers',
  'ClusterLoggings',
  'ClusterMonitorGraphs',
  'ClusterOutputs',
  'ClusterRegistrations',
  'ClusterRegistrationTokens',
  'ClusterRepos',
  'ClusterRoles',
  'ClusterRoleBindings',
  'ClusterRoleTemplateBindings',
  'ClusterScans',
  'ClusterTemplates',
  'ClusterTemplateRevisions',
  'ComponentStatuses',
  'ComposeConfigs',
  'Configs',
  'ConfigMaps',
  'ConstraintPodStatuses',
  'ConstraintTemplates',
  'ConstraintTemplatePodStatuses',
  'Contents',
  'ControllerRevisions',
  'CronJobs',
  'CustomResourceDefinitions',
  'DaemonSets',
  'Deployments',
  'DestinationRules',
  'DynamicSchemas',
  'EndpointSlices',
  'Endpoints',
  'EnvoyFilters',
  'EtcdBackups',
  'Events',
  'Features',
  'FleetWorkspaces',
  'Flows',
  'Gateways',
  'GitJobs',
  'GitRepos',
  'GitRepoRestrictions',
  'GlobalDnses',
  'GlobalDnsProviders',
  'GlobalRoles',
  'GlobalRoleBindings',
  'Groups',
  'GroupMembers',
  'HTTPAPISpecs',
  'HTTPAPISpecBindings',
  'HorizontalPodAutoscalers',
  'Ingresses',
  'IngressClasses',
  'Issuers',
  'IstioOperators',
  'Jobs',
  'K8sAllowedRepos',
  'K8sRequiredLabels',
  'KontainerDrivers',
  'Leases',
  'LimitRanges',
  'Loggings',
  'MonitorMetrics',
  'MonitoringDashboards',
  'MultiClusterApps',
  'MultiClusterAppRevisions',
  'MutatingWebhookConfigurations',
  'Namespaces',
  'NetworkPolicies',
  'Nodes',
  'NodeDrivers',
  'NodeMetrics',
  'NodePools',
  'NodeTemplates',
  'Notifiers',
  'Operations',
  'Orders',
  'Outputs',
  'PeerAuthentications',
  'PersistentVolumes',
  'PersistentVolumeClaims',
  'Pipelines',
  'PipelineExecutions',
  'PipelineSettings',
  'Pods',
  'PodDisruptionBudgets',
  'PodMetrics',
  'PodMonitors',
  'PodSecurityPolicies',
  'PodSecurityPolicyTemplates',
  'PodSecurityPolicyTemplateProjectBindings',
  'PodTemplates',
  'Preferences',
  'PriorityClasses',
  'Projects',
  'ProjectAlerts',
  'ProjectAlertGroups',
  'ProjectAlertRules',
  'ProjectCatalogs',
  'ProjectLoggings',
  'ProjectMonitorGraphs',
  'ProjectNetworkPolicies',
  'ProjectRoleTemplateBindings',
  'Prometheuses',
  'PrometheusRules',
  'QuotaSpecs',
  'QuotaSpecBindings',
  'ReplicaSets',
  'ReplicationControllers',
  'RequestAuthentications',
  'ResourceQuotas',
  'RkeAddons',
  'RkeK8sServiceOptions',
  'RkeK8sSystemImages',
  'Roles',
  'RoleBindings',
  'RoleTemplates',
  'RoleTemplateBindings',
  'RuntimeClasses',
  'SamlTokens',
  'Secrets',
  'Services',
  'ServiceAccounts',
  'ServiceEntries',
  'ServiceMonitors',
  'Settings',
  'Sidecars',
  'SourceCodeCredentials',
  'SourceCodeProviderConfigs',
  'SourceCodeRepositories',
  'StatefulSets',
  'StorageClasses',
  'Templates',
  'TemplateContents',
  'TemplateVersions',
  'Tokens',
  'Users',
  'UserAttributes',
  'ValidatingWebhookConfigurations',
  'VirtualServices',
  'VolumeAttachments',
  'WorkloadEntries'
];

export default class RoleTemplate extends SteveModel {
  get customValidationRules() {
    return Role.customValidationRules();
  }

  get details() {
    const out = this._details;

    out.unshift({
      label:         this.t('resourceDetail.detailTop.name'),
      content:       get(this, 'name')
    },
    // API returns a blank description property, this overrides our own link to the description
    {
      label:         this.t('resourceDetail.detailTop.description'),
      content:       this.metadata?.annotations?.[DESCRIPTION]
    });

    return out;
  }

  get state() {
    return this.locked ? 'locked' : this.metadata?.state?.name || 'unknown';
  }

  get subtype() {
    if (this._subtype) {
      return this._subtype;
    }

    if (this.type === SUBTYPE_MAPPING.CLUSTER.type && this.context === SUBTYPE_MAPPING.CLUSTER.context) {
      return SUBTYPE_MAPPING.CLUSTER.key;
    }

    if (this.type === SUBTYPE_MAPPING.NAMESPACE.type && this.context === SUBTYPE_MAPPING.NAMESPACE.context) {
      return SUBTYPE_MAPPING.NAMESPACE.key;
    }

    return null;
  }

  updateSubtype(subtype) {
    Vue.set(this, '_subtype', subtype);
    this.context = SUBTYPE_MAPPING[subtype].context;
  }

  get default() {
    const defaultKey = SUBTYPE_MAPPING[this.subtype]?.defaultKey;

    return !!this[defaultKey];
  }

  updateDefault(value) {
    const defaultKey = SUBTYPE_MAPPING[this.subtype].defaultKey;

    Vue.set(this, defaultKey, value);
  }

  get resources() {
    // List is hardcoded instead of determined from available schemas (we don't know which cluster/project roles will be applied to)
    return RESOURCES;
  }

  get listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ this.subtype }`
    };
  }

  get detailLocation() {
    return {
      ...this._detailLocation,
      name: `c-cluster-auth-roles-resource-id`,
    };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.ROLE_TEMPLATE }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.ROLE_TEMPLATE, name: this.displayName }, { root: true });
  }

  get norman() {
    return (async() => {
      const norman = await this.basicNorman;

      norman.rules = this.rules;
      norman.locked = this.locked;
      norman.clusterCreatorDefault = this.clusterCreatorDefault || false;
      norman.projectCreatorDefault = this.projectCreatorDefault || false;
      norman.context = this.context;
      norman.description = this.description;
      norman.roleTemplateIds = this.roleTemplateNames;

      return norman;
    })();
  }

  async save() {
    const norman = await this.norman;

    return norman.save();
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove();
  }
}
