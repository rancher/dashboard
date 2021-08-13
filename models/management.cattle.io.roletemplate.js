import Vue from 'vue';
import { get } from '@/utils/object';
import { DESCRIPTION } from '@/config/labels-annotations';
import { NORMAN } from '@/config/types';
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
  'APIGroup',
  'APIService',
  'Alertmanager',
  'App',
  'AppRevision',
  'AuthConfig',
  'AuthorizationPolicy',
  'Bundle',
  'BundleDeployment',
  'BundleNamespaceMapping',
  'CSIDriver',
  'CSINode',
  'Catalog',
  'CatalogTemplate',
  'CatalogTemplateVersion',
  'Certificate',
  'CertificateRequest',
  'CertificateSigningRequest',
  'Challenge',
  'CisBenchmarkVersion',
  'CisConfig',
  'Cluster',
  'ClusterAlert',
  'ClusterAlertGroup',
  'ClusterAlertRule',
  'ClusterCatalog',
  'ClusterFlow',
  'ClusterGroup',
  'ClusterIssuer',
  'ClusterLogging',
  'ClusterMonitorGraph',
  'ClusterOutput',
  'ClusterRegistration',
  'ClusterRegistrationToken',
  'ClusterRepo',
  'ClusterRole',
  'ClusterRoleBinding',
  'ClusterRoleTemplateBinding',
  'ClusterScan',
  'ClusterTemplate',
  'ClusterTemplateRevision',
  'ComponentStatus',
  'ComposeConfig',
  'Config',
  'ConfigMap',
  'ConstraintPodStatus',
  'ConstraintTemplate',
  'ConstraintTemplatePodStatus',
  'Content',
  'ControllerRevision',
  'CronJob',
  'CustomResourceDefinition',
  'DaemonSet',
  'Deployment',
  'DestinationRule',
  'DynamicSchema',
  'EndpointSlice',
  'Endpoints',
  'EnvoyFilter',
  'EtcdBackup',
  'Event',
  'Feature',
  'FleetWorkspace',
  'Flow',
  'Gateway',
  'GitJob',
  'GitRepo',
  'GitRepoRestriction',
  'GlobalDns',
  'GlobalDnsProvider',
  'GlobalRole',
  'GlobalRoleBinding',
  'Group',
  'GroupMember',
  'HTTPAPISpec',
  'HTTPAPISpecBinding',
  'HorizontalPodAutoscaler',
  'Ingress',
  'IngressClass',
  'Issuer',
  'IstioOperator',
  'Job',
  'K8sAllowedRepos',
  'K8sRequiredLabels',
  'KontainerDriver',
  'Lease',
  'LimitRange',
  'Logging',
  'MonitorMetric',
  'MonitoringDashboard',
  'MultiClusterApp',
  'MultiClusterAppRevision',
  'MutatingWebhookConfiguration',
  'Namespace',
  'NetworkPolicy',
  'Node',
  'NodeDriver',
  'NodeMetrics',
  'NodePool',
  'NodeTemplate',
  'Notifier',
  'Operation',
  'Order',
  'Output',
  'PeerAuthentication',
  'PersistentVolume',
  'PersistentVolumeClaim',
  'Pipeline',
  'PipelineExecution',
  'PipelineSetting',
  'Pod',
  'PodDisruptionBudget',
  'PodMetrics',
  'PodMonitor',
  'PodSecurityPolicy',
  'PodSecurityPolicyTemplate',
  'PodSecurityPolicyTemplateProjectBinding',
  'PodTemplate',
  'Preference',
  'PriorityClass',
  'Project',
  'ProjectAlert',
  'ProjectAlertGroup',
  'ProjectAlertRule',
  'ProjectCatalog',
  'ProjectLogging',
  'ProjectMonitorGraph',
  'ProjectNetworkPolicy',
  'ProjectRoleTemplateBinding',
  'Prometheus',
  'PrometheusRule',
  'QuotaSpec',
  'QuotaSpecBinding',
  'ReplicaSet',
  'ReplicationController',
  'RequestAuthentication',
  'ResourceQuota',
  'RkeAddon',
  'RkeK8sServiceOption',
  'RkeK8sSystemImage',
  'Role',
  'RoleBinding',
  'RoleTemplate',
  'RoleTemplateBinding',
  'RuntimeClass',
  'SamlToken',
  'Secret',
  'Service',
  'ServiceAccount',
  'ServiceEntry',
  'ServiceMonitor',
  'Setting',
  'Sidecar',
  'SourceCodeCredential',
  'SourceCodeProviderConfig',
  'SourceCodeRepository',
  'StatefulSet',
  'StorageClass',
  'Template',
  'TemplateContent',
  'TemplateVersion',
  'Token',
  'User',
  'UserAttribute',
  'ValidatingWebhookConfiguration',
  'VirtualService',
  'VolumeAttachment',
  'WorkloadEntry'
];

export default {
  customValidationRules() {
    return Role.customValidationRules();
  },

  details() {
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
  },

  state() {
    return this.locked ? 'locked' : this.metadata?.state?.name || 'unknown';
  },

  subtype() {
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
  },

  updateSubtype() {
    return (subtype) => {
      Vue.set(this, '_subtype', subtype);
      this.context = SUBTYPE_MAPPING[subtype].context;
    };
  },

  default() {
    const defaultKey = SUBTYPE_MAPPING[this.subtype]?.defaultKey;

    return !!this[defaultKey];
  },

  updateDefault() {
    return (value) => {
      const defaultKey = SUBTYPE_MAPPING[this.subtype].defaultKey;

      Vue.set(this, defaultKey, value);
    };
  },

  resources() {
    // List is hardcoded instead of determined from available schemas (we don't know which cluster/project roles will be applied to)
    return RESOURCES;
  },

  listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ this.subtype }`
    };
  },

  detailLocation() {
    return {
      ...this._detailLocation,
      name: `c-cluster-auth-roles-resource-id`,
    };
  },

  doneOverride() {
    return this.listLocation;
  },

  parentLocationOverride() {
    return this.listLocation;
  },

  basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.ROLE_TEMPLATE }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.ROLE_TEMPLATE, name: this.displayName }, { root: true });
  },

  async norman() {
    const norman = await this.basicNorman;

    norman.rules = this.rules;
    norman.locked = this.locked;
    norman.clusterCreatorDefault = this.clusterCreatorDefault || false;
    norman.projectCreatorDefault = this.projectCreatorDefault || false;
    norman.context = this.context;
    norman.description = this.description;
    norman.roleTemplateIds = this.roleTemplateNames;

    return norman;
  },

  save() {
    return async() => {
      const norman = await this.norman;

      return norman.save();
    };
  },

  remove() {
    return async() => {
      const norman = await this.norman;

      await norman.remove();
    };
  }
};
