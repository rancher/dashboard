// --------------------------------------
// 1. Provided by Steve and always potentially available
// --------------------------------------

// Steve-specific virtual types
// Base: /v1
export const STEVE = { PREFERENCE: 'userpreference' };

// Old APIs via Norman
// Base: /v3
export const NORMAN = {
  APP:                           'app',
  AUTH_CONFIG:                   'authconfig',
  ETCD_BACKUP:                   'etcdbackup',
  CLUSTER:                       'cluster',
  CLUSTER_TOKEN:                 'clusterregistrationtoken',
  CLUSTER_ROLE_TEMPLATE_BINDING: 'clusterRoleTemplateBinding',
  CLOUD_CREDENTIAL:              'cloudcredential',
  FLEET_WORKSPACES:              'fleetworkspace',
  GLOBAL_ROLE:                   'globalRole',
  GLOBAL_ROLE_BINDING:           'globalRoleBinding',

  NODE_POOL:                     'nodePool',
  // Note - This allows access to node resources, not schema's or custom components (both are accessed via 'type' which clashes with kube node)
  NODE:                          'node',
  PRINCIPAL:                     'principal',
  PROJECT:                       'project',
  PROJECT_ROLE_TEMPLATE_BINDING: 'projectroletemplatebinding',
  SPOOFED:                       { GROUP_PRINCIPAL: 'group.principal' },
  ROLE_TEMPLATE:                 'roleTemplate',
  TOKEN:                         'token',
  USER:                          'user',
};

// Public (via Norman)
// Base: /v3-public
export const PUBLIC = { AUTH_PROVIDER: 'authprovider' };

// Common native k8s types (via Steve)
// Base: /k8s/clusters/<id>/v1/
export const API_GROUP = 'apiGroups';
export const API_SERVICE = 'apiregistration.k8s.io.apiservice';
export const CONFIG_MAP = 'configmap';
export const COUNT = 'count';
export const EVENT = 'event';
export const ENDPOINTS = 'endpoints';
export const HPA = 'autoscaling.horizontalpodautoscaler';
export const INGRESS = 'networking.k8s.io.ingress';
export const INGRESS_CLASS = 'networking.k8s.io.ingressclass';
export const NAMESPACE = 'namespace';
export const NODE = 'node';
export const NETWORK_POLICY = 'networking.k8s.io.networkpolicy';
export const POD = 'pod';
export const PV = 'persistentvolume';
export const PVC = 'persistentvolumeclaim';
export const RESOURCE_QUOTA = 'resourcequota';
export const SCHEMA = 'schema';
export const SERVICE = 'service';
export const SECRET = 'secret';
export const SERVICE_ACCOUNT = 'serviceaccount';
export const STORAGE_CLASS = 'storage.k8s.io.storageclass';
export const OBJECT_META = 'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta';
export const NETWORK_ATTACHMENT = 'k8s.cni.cncf.io.networkattachmentdefinition';

export const RBAC = {
  ROLE:                 'rbac.authorization.k8s.io.role',
  CLUSTER_ROLE:         'rbac.authorization.k8s.io.clusterrole',
  ROLE_BINDING:         'rbac.authorization.k8s.io.rolebinding',
  CLUSTER_ROLE_BINDING: 'rbac.authorization.k8s.io.clusterrolebinding',
};

export const WORKLOAD = 'workload';

// The types that are aggregated into a "workload"
export const WORKLOAD_TYPES = {
  DEPLOYMENT:             'apps.deployment',
  CRON_JOB:               'batch.cronjob',
  DAEMON_SET:             'apps.daemonset',
  JOB:                    'batch.job',
  STATEFUL_SET:           'apps.statefulset',
  REPLICA_SET:            'apps.replicaset',
  REPLICATION_CONTROLLER: 'replicationcontroller',
  POD:                    'pod'
};

const {
  DAEMON_SET, CRON_JOB, JOB, ...scalableWorkloads
} = WORKLOAD_TYPES;

export const SCALABLE_WORKLOAD_TYPES = scalableWorkloads;

export const METRIC = {
  NODE: 'metrics.k8s.io.nodemetrics',
  POD:  'metrics.k8s.io.podmetrics',
};

export const CATALOG = {
  CLUSTER_REPO:   'catalog.cattle.io.clusterrepo',
  OPERATION:      'catalog.cattle.io.operation',
  APP:            'catalog.cattle.io.app',
  REPO:           'catalog.cattle.io.repo',
};

export const HELM = { PROJECTHELMCHART: 'helm.cattle.io.projecthelmchart' };

export const MONITORING = {
  ALERTMANAGER:       'monitoring.coreos.com.alertmanager',
  ALERTMANAGERCONFIG: 'monitoring.coreos.com.alertmanagerconfig',
  PODMONITOR:         'monitoring.coreos.com.podmonitor',
  PROMETHEUS:         'monitoring.coreos.com.prometheus',
  PROMETHEUSRULE:     'monitoring.coreos.com.prometheusrule',
  SERVICEMONITOR:     'monitoring.coreos.com.servicemonitor',
  THANOSRULER:        'monitoring.coreos.com.thanosruler',
  SPOOFED:            {
    RECEIVER:                         'monitoring.coreos.com.receiver',
    RECEIVER_SPEC:                    'monitoring.coreos.com.receiver.spec',
    RECEIVER_EMAIL:                   'monitoring.coreos.com.receiver.email',
    RECEIVER_SLACK:                   'monitoring.coreos.com.receiver.slack',
    RECEIVER_WEBHOOK:                 'monitoring.coreos.com.receiver.webhook',
    RECEIVER_PAGERDUTY:               'monitoring.coreos.com.receiver.pagerduty',
    RECEIVER_OPSGENIE:                'monitoring.coreos.com.receiver.opsgenie',
    RECEIVER_HTTP_CONFIG:             'monitoring.coreos.com.receiver.httpconfig',
    RESPONDER:                        'monitoring.coreos.com.receiver.responder',
    ROUTE:                            'monitoring.coreos.com.route',
    ROUTE_SPEC:                       'monitoring.coreos.com.route.spec',
    ALERTMANAGERCONFIG_RECEIVER_SPEC:       'monitoring.coreos.com.v1alpha1.alertmanagerconfig.spec.receivers',
    ALERTMANAGERCONFIG_ROUTE_SPEC:          'monitoring.coreos.com.v1alpha1.alertmanagerconfig.spec.route'
  }
};

export const LONGHORN = {
  ENGINES:       'longhorn.io.engine',
  ENGINE_IMAGES: 'longhorn.io.engineimage',
  NODES:         'longhorn.io.node',
  REPLICAS:      'longhorn.io.replica',
  SETTINGS:      'longhorn.io.setting',
  VOLUMES:       'longhorn.io.volume',
};

export const SNAPSHOT = 'rke.cattle.io.etcdsnapshot';

// --------------------------------------
// 2. Only if Rancher is installed
// --------------------------------------

// Rancher Management API (via Steve)
// Base: /v1
export const MANAGEMENT = {
  AUTH_CONFIG:                   'management.cattle.io.authconfig',
  CATALOG_TEMPLATE:              'management.cattle.io.catalogtemplate',
  // CATALOG:                       'management.cattle.io.catalog',
  CLUSTER:                       'management.cattle.io.cluster',
  CLUSTER_ROLE_TEMPLATE_BINDING: 'management.cattle.io.clusterroletemplatebinding',
  FEATURE:                       'management.cattle.io.feature',
  // GROUP:                         'management.cattle.io.group',
  KONTAINER_DRIVER:              'management.cattle.io.kontainerdriver',
  MULTI_CLUSTER_APP:             'management.cattle.io.multiclusterapp',
  NODE:                          'management.cattle.io.node',
  NODE_DRIVER:                   'management.cattle.io.nodedriver',
  NODE_POOL:                     'management.cattle.io.nodepool',
  NODE_TEMPLATE:                 'management.cattle.io.nodetemplate',
  PROJECT:                       'management.cattle.io.project',
  PROJECT_ROLE_TEMPLATE_BINDING: 'management.cattle.io.projectroletemplatebinding',
  ROLE_TEMPLATE:                 'management.cattle.io.roletemplate',
  SETTING:                       'management.cattle.io.setting',
  USER:                          'management.cattle.io.user',
  TOKEN:                         'management.cattle.io.token',
  GLOBAL_ROLE:                   'management.cattle.io.globalrole',
  GLOBAL_ROLE_BINDING:           'management.cattle.io.globalrolebinding',
  POD_SECURITY_POLICY_TEMPLATE:  'management.cattle.io.podsecuritypolicytemplate',
  MANAGED_CHART:                 'management.cattle.io.managedchart',
  USER_NOTIFICATION:             'management.cattle.io.rancherusernotification',
  GLOBAL_DNS_PROVIDER:           'management.cattle.io.globaldnsprovider',
  RKE_TEMPLATE:                  'management.cattle.io.clustertemplate',
  RKE_TEMPLATE_REVISION:         'management.cattle.io.clustertemplaterevision',
};

export const CAPI = {
  CAPI_CLUSTER:         'cluster.x-k8s.io.cluster',
  MACHINE_DEPLOYMENT:   'cluster.x-k8s.io.machinedeployment',
  MACHINE_SET:          'cluster.x-k8s.io.machineset',
  MACHINE:              'cluster.x-k8s.io.machine',
  RANCHER_CLUSTER:      'provisioning.cattle.io.cluster',
  MACHINE_CONFIG_GROUP: 'rke-machine-config.cattle.io',
};

// --------------------------------------
// 3. Optional add-on packages in a cluster
// --------------------------------------
// Base: /k8s/clusters/<id>/v1/

export const FLEET = {
  BUNDLE:            'fleet.cattle.io.bundle',
  BUNDLE_DEPLOYMENT: 'fleet.cattle.io.bundledeployment',
  CLUSTER:           'fleet.cattle.io.cluster',
  CLUSTER_GROUP:     'fleet.cattle.io.clustergroup',
  DASHBOARD:         'fleet.cattle.io.dashboard',
  GIT_REPO:          'fleet.cattle.io.gitrepo',
  WORKSPACE:         'management.cattle.io.fleetworkspace',
  TOKEN:             'fleet.cattle.io.clusterregistrationtoken',
};

export const GATEKEEPER = {
  CONSTRAINT_TEMPLATE: 'templates.gatekeeper.sh.constrainttemplate',
  SPOOFED:             { CONSTRAINT: 'constraints.gatekeeper.sh.constraint' }
};

export const ISTIO = {
  VIRTUAL_SERVICE:  'networking.istio.io.virtualservice',
  DESTINATION_RULE:  'networking.istio.io.destinationrule',
  GATEWAY:          'networking.istio.io.gateway'
};

export const LOGGING = {
  // LOGGING:        'logging.banzaicloud.io.logging',
  CLUSTER_FLOW:   'logging.banzaicloud.io.clusterflow',
  CLUSTER_OUTPUT: 'logging.banzaicloud.io.clusteroutput',
  FLOW:           'logging.banzaicloud.io.flow',
  OUTPUT:         'logging.banzaicloud.io.output',
  SPOOFED:        {
    FILTERS:            'logging.banzaicloud.io.output.filters',
    FILTER:             'logging.banzaicloud.io.output.filter',
    CONCAT:             'logging.banzaicloud.io.output.filters.concat',
    DEDOT:              'logging.banzaicloud.io.output.filters.dedot',
    DETECTEXCEPTIONS:   'logging.banzaicloud.io.output.filters.detectExceptions',
    GEOIP:              'logging.banzaicloud.io.output.filters.geoip',
    GREP:               'logging.banzaicloud.io.output.filters.grep',
    PARSER:             'logging.banzaicloud.io.output.filters.parser',
    PROMETHEUS:         'logging.banzaicloud.io.output.filters.prometheus',
    RECORD_MODIFIER:    'logging.banzaicloud.io.output.filters.record_modifier',
    RECORD_TRANSFORMER: 'logging.banzaicloud.io.output.filters.record_transformer',
    STDOUT:             'logging.banzaicloud.io.output.filters.stdout',
    SUMOLOGIC:          'logging.banzaicloud.io.output.filters.sumologic',
    TAG_NORMALISER:     'logging.banzaicloud.io.output.filters.tag_normaliser',
    THROTTLE:           'logging.banzaicloud.io.output.filters.throttle',
    RECORD:             'logging.banzaicloud.io.output.filters.record',
    REGEXPSECTION:      'logging.banzaicloud.io.output.filters.regexpsection',
    EXCLUDESECTION:     'logging.banzaicloud.io.output.filters.excludesection',
    ORSECTION:          'logging.banzaicloud.io.output.filters.orsection',
    ANDSECTION:         'logging.banzaicloud.io.output.filters.andsection',
    PARSESECTION:       'logging.banzaicloud.io.output.filters.parsesection',
    METRICSECTION:      'logging.banzaicloud.io.output.filters.metricsection',
    REPLACE:            'logging.banzaicloud.io.output.filters.replace',
    SINGLEPARSESECTION: 'logging.banzaicloud.io.output.filters.replace.singleparsesection'
  }
};

export const BACKUP_RESTORE = {
  RESOURCE_SET: 'resources.cattle.io.resourceset',
  BACKUP:       'resources.cattle.io.backup',
  RESTORE:      'resources.cattle.io.restore',
};

export const CIS = {
  CLUSTER_SCAN:         'cis.cattle.io.clusterscan',
  CLUSTER_SCAN_PROFILE: 'cis.cattle.io.clusterscanprofile',
  BENCHMARK:            'cis.cattle.io.clusterscanbenchmark',
  REPORT:               'cis.cattle.io.clusterscanreport'
};

export const UI = { NAV_LINK: 'ui.cattle.io.navlink' };

export const VIRTUAL_TYPES = {
  CLUSTER_MEMBERS:    'cluster-members',
  PROJECT_NAMESPACES: 'projects-namespaces',
  NAMESPACES:         'namespaces'
};

// harvester
export const HCI = {
  CLUSTER:   'harvesterhci.io.management.cluster',
  DASHBOARD: 'harvesterhci.io.dashboard',
  IMAGE:     'harvesterhci.io.virtualmachineimage',
  SETTING:   'harvesterhci.io.setting',
};

export const VIRTUAL_HARVESTER_PROVIDER = 'harvester';

export const ADDRESSES = {
  HOSTNAME:    'Hostname',
  INTERNAL_IP: 'InternalIP'
};

export const DEFAULT_WORKSPACE = 'fleet-default';

export const AUTH_TYPE = {
  _NONE:  '_none',
  _BASIC: '_basic',
  _SSH:   '_ssh',
  _S3:    '_S3'
};
