/**
 * Declarations for the untyped `types.js` in this directory, so that `.ts` modules
 * importing it still type-check when an extension builds against `@rancher/shell`
 * (its own `tsconfig` sets `checkJs: false`, so the `.js` has no types of its own).
 *
 * Seeded from:
 *   ./node_modules/.bin/tsc shell/config/types.js --declaration --allowJs --emitDeclarationOnly --outDir <tmp>
 * then adjusted so the constant objects are declared as values (`export const X: {...}`)
 * rather than namespaces, which cannot be used where a value is expected.
 */

export const STEVE: {
    PREFERENCE: string;
    SCHEMA_DEFINITION: string;
};
export const NORMAN: {
    APP: string;
    AUTH_CONFIG: string;
    CLUSTER: string;
    CLUSTER_TOKEN: string;
    CLUSTER_ROLE_TEMPLATE_BINDING: string;
    CLOUD_CREDENTIAL: string;
    FLEET_WORKSPACES: string;
    GLOBAL_ROLE: string;
    GLOBAL_ROLE_BINDING: string;
    NODE_POOL: string;
    NODE: string;
    PRINCIPAL: string;
    PROJECT: string;
    PROJECT_ROLE_TEMPLATE_BINDING: string;
    SETTING: string;
    SPOOFED: {
        GROUP_PRINCIPAL: string;
    };
    ROLE_TEMPLATE: string;
    TOKEN: string;
    USER: string;
    KONTAINER_DRIVER: string;
    NODE_DRIVER: string;
};
export const PUBLIC: {
    AUTH_PROVIDER: string;
};
export const API_GROUP: 'apiGroups';
export const API_SERVICE: 'apiregistration.k8s.io.apiservice';
export const CONFIG_MAP: 'configmap';
export const COUNT: 'count';
export const CRD: 'apiextensions.k8s.io.customresourcedefinition';
export const EVENT: 'event';
export const ENDPOINTS: 'endpoints';
export const HPA: 'autoscaling.horizontalpodautoscaler';
export const INGRESS: 'networking.k8s.io.ingress';
export const INGRESS_CLASS: 'networking.k8s.io.ingressclass';
export const LIMIT_RANGE: 'limitrange';
export const NAMESPACE: 'namespace';
export const NODE: 'node';
export const NETWORK_POLICY: 'networking.k8s.io.networkpolicy';
export const POD: 'pod';
export const POD_DISRUPTION_BUDGET: 'policy.poddisruptionbudget';
export const PV: 'persistentvolume';
export const PVC: 'persistentvolumeclaim';
export const RESOURCE_QUOTA: 'resourcequota';
export const AUDIT_POLICY: 'auditlog.cattle.io.auditpolicy';
export const SCHEMA: 'schema';
export const SERVICE: 'service';
export const SECRET: 'secret';
export const SERVICE_ACCOUNT: 'serviceaccount';
export const STORAGE_CLASS: 'storage.k8s.io.storageclass';
export const CSI_DRIVER: 'storage.k8s.io.csidriver';
export const OBJECT_META: 'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta';
export const NETWORK_ATTACHMENT: 'k8s.cni.cncf.io.networkattachmentdefinition';
export const USER: 'user';
export const GROUP: 'group';
export const RBAC: {
    ROLE: string;
    CLUSTER_ROLE: string;
    ROLE_BINDING: string;
    CLUSTER_ROLE_BINDING: string;
};
export const WORKLOAD: 'workload';
export const WORKLOAD_DASHBOARD: 'workload-dashboard';
export const WORKLOAD_TYPES: {
    DEPLOYMENT: string;
    CRON_JOB: string;
    DAEMON_SET: string;
    JOB: string;
    STATEFUL_SET: string;
    REPLICA_SET: string;
    REPLICATION_CONTROLLER: string;
};
export const WORKLOAD_KINDS: {
    DEPLOYMENT: string;
    CRON_JOB: string;
    DAEMON_SET: string;
    JOB: string;
    STATEFUL_SET: string;
    REPLICA_SET: string;
    REPLICATION_CONTROLLER: string;
};
/**
 * Map Rancher Workload types to Kube Workload Kinds
 */
export const WORKLOAD_TYPE_TO_KIND_MAPPING: {
    [x: string]: string;
};
/**
 * Map Kube Workload Kinds types to Rancher Workload
 */
export const WORKLOAD_KIND_TO_TYPE_MAPPING: {
    [x: string]: string;
};
export const METRICS_SUPPORTED_KINDS: string[];
export const SCALABLE_WORKLOAD_TYPES: Record<string, string>;
export const LIST_WORKLOAD_TYPES: {
    POD: typeof POD;
};
export const METRIC: {
    NODE: string;
    POD: string;
};
export const CATALOG: {
    CLUSTER_REPO: string;
    OPERATION: string;
    APP: string;
    REPO: string;
};
export const CATALOG_SORT_OPTIONS: {
    RECOMMENDED: string;
    LAST_UPDATED_DESC: string;
    ALPHABETICAL_ASC: string;
    ALPHABETICAL_DESC: string;
};
export const UI_PLUGIN: 'catalog.cattle.io.uiplugin';
export const HELM: {
    PROJECTHELMCHART: string;
};
export const MONITORING: {
    ALERTMANAGER: string;
    ALERTMANAGERCONFIG: string;
    PODMONITOR: string;
    PROMETHEUS: string;
    PROMETHEUSRULE: string;
    SERVICEMONITOR: string;
    THANOSRULER: string;
    SPOOFED: {
        RECEIVER: string;
        RECEIVER_SPEC: string;
        RECEIVER_EMAIL: string;
        RECEIVER_SLACK: string;
        RECEIVER_WEBHOOK: string;
        RECEIVER_PAGERDUTY: string;
        RECEIVER_OPSGENIE: string;
        RECEIVER_HTTP_CONFIG: string;
        RESPONDER: string;
        ROUTE: string;
        ROUTE_SPEC: string;
    };
};
export const LONGHORN: {
    ENGINES: string;
    ENGINE_IMAGES: string;
    NODES: string;
    REPLICAS: string;
    SETTINGS: string;
    VOLUMES: string;
};
export const LONGHORN_DRIVER: 'driver.longhorn.io';
export const LONGHORN_VERSION_V1: 'LonghornV1';
export const LONGHORN_VERSION_V2: 'LonghornV2';
export const SNAPSHOT: 'rke.cattle.io.etcdsnapshot';
export const OPERATION: {
    ETCD_SNAPSHOT: string;
    ETCD_SNAPSHOT_RESTORE: string;
    ENCRYPTION_KEY_ROTATE: string;
};
export const MANAGEMENT: {
    AUTH_CONFIG: string;
    CATALOG_TEMPLATE: string;
    CLUSTER: string;
    CLUSTER_ROLE_TEMPLATE_BINDING: string;
    FEATURE: string;
    KONTAINER_DRIVER: string;
    MULTI_CLUSTER_APP: string;
    NODE: string;
    NODE_DRIVER: string;
    NODE_POOL: string;
    NODE_TEMPLATE: string;
    PROJECT: string;
    PROJECT_ROLE_TEMPLATE_BINDING: string;
    ROLE_TEMPLATE: string;
    SETTING: string;
    USER: string;
    TOKEN: string;
    GLOBAL_ROLE: string;
    GLOBAL_ROLE_BINDING: string;
    PSA: string;
    MANAGED_CHART: string;
    USER_NOTIFICATION: string;
    GLOBAL_DNS_PROVIDER: string;
    RKE_TEMPLATE: string;
    RKE_TEMPLATE_REVISION: string;
    CLUSTER_PROXY_CONFIG: string;
    OIDC_CLIENT: string;
    PROXY_ENDPOINT: string;
};
export const BRAND: {
    SUSE: string;
    CSP: string;
    FEDERAL: string;
    RGS: string;
};
export const EXT: {
    USER_ACTIVITY: string;
    SELFUSER: string;
    GROUP_MEMBERSHIP_REFRESH_REQUESTS: string;
    PASSWORD_CHANGE_REQUESTS: string;
    KUBECONFIG: string;
};
export const CAPI: {
    CAPI_CLUSTER: string;
    MACHINE_DEPLOYMENT: string;
    MACHINE_SET: string;
    MACHINE: string;
    RANCHER_CLUSTER: string;
    MACHINE_CONFIG_GROUP: string;
    CAPI_PROVIDER: string;
};
export const FLEET: {
    APPLICATION: string;
    BUNDLE: string;
    BUNDLE_DEPLOYMENT: string;
    CLUSTER: string;
    CLUSTER_GROUP: string;
    DASHBOARD: string;
    GIT_REPO: string;
    HELM_OP: string;
    SUSE_APP_COLLECTION: string;
    WORKSPACE: string;
    TOKEN: string;
    BUNDLE_NAMESPACE_MAPPING: string;
    GIT_REPO_RESTRICTION: string;
};
export const GATEKEEPER: {
    CONSTRAINT_TEMPLATE: string;
    SPOOFED: {
        CONSTRAINT: string;
    };
};
export const ISTIO: {
    VIRTUAL_SERVICE: string;
    DESTINATION_RULE: string;
    GATEWAY: string;
};
export const GATEWAY_API: {
    GATEWAY: string;
    HTTP_ROUTE: string;
};
export const LOGGING: {
    CLUSTER_FLOW: string;
    CLUSTER_OUTPUT: string;
    FLOW: string;
    OUTPUT: string;
    SPOOFED: {
        FILTERS: string;
        FILTER: string;
        CONCAT: string;
        DEDOT: string;
        DETECTEXCEPTIONS: string;
        GEOIP: string;
        GREP: string;
        PARSER: string;
        PROMETHEUS: string;
        RECORD_MODIFIER: string;
        RECORD_TRANSFORMER: string;
        STDOUT: string;
        SUMOLOGIC: string;
        TAG_NORMALISER: string;
        THROTTLE: string;
        RECORD: string;
        REGEXPSECTION: string;
        EXCLUDESECTION: string;
        ORSECTION: string;
        ANDSECTION: string;
        PARSESECTION: string;
        METRICSECTION: string;
        REPLACE: string;
        SINGLEPARSESECTION: string;
    };
};
export const BACKUP_RESTORE: {
    RESOURCE_SET: string;
    BACKUP: string;
    RESTORE: string;
};
export const COMPLIANCE: {
    CLUSTER_SCAN: string;
    CLUSTER_SCAN_PROFILE: string;
    BENCHMARK: string;
    REPORT: string;
};
export const UI: {
    NAV_LINK: string;
};
export const VIRTUAL_TYPES: {
    CLUSTER_MEMBERS: string;
    PROJECT_NAMESPACES: string;
    NAMESPACES: string;
    PROJECT_SECRETS: string;
    JWT_AUTHENTICATION: string;
};
export const HCI: {
    CLUSTER: string;
    DASHBOARD: string;
    IMAGE: string;
    VGPU_DEVICE: string;
    SETTING: string;
    RESOURCE_QUOTA: string;
    HARVESTER_CONFIG: string;
};
export const VIRTUAL_HARVESTER_PROVIDER: 'harvester';
export const ADDRESSES: {
    HOSTNAME: string;
    INTERNAL_IP: string;
    EXTERNAL_IP: string;
};
export const DEFAULT_WORKSPACE: 'fleet-default';
export const AUTH_TYPE: {
    _NONE: string;
    _BASIC: string;
    _SSH: string;
    _S3: string;
    _RKE: string;
    _IMAGE_PULL_SECRET: string;
    _GITHUB_APP: string;
};
export const LOCAL_CLUSTER: 'local';
export const CLUSTER_REPO_TYPES: {
    HELM_URL: string;
    GIT_REPO: string;
    OCI_URL: string;
    SUSE_APP_COLLECTION: string;
};
/**
 * The `generateName` prefix used when creating authentication secrets
 * for SUSE App Collection repositories.
 */
export const CLUSTER_REPO_APPCO_AUTH_GENERATE_NAME: 'clusterrepo-appco-auth-';
/**
 * The `generateName` prefix used when creating authentication secrets
 * for standard repositories.
 */
export const CLUSTER_REPO_AUTH_GENERATE_NAME: 'clusterrepo-auth-';
/**
 * The `generateName` prefix used when creating Helm Op authentication secrets
 * for standard Helm sources.
 */
export const AUTH_GENERATE_NAME: 'auth-';
export const ZERO_TIME: '0001-01-01T00:00:00Z';
export const DEFAULT_GRAFANA_STORAGE_SIZE: '10Gi';
export const DEPRECATED: 'Deprecated';
export const EXPERIMENTAL: 'Experimental';
export const AUTOSCALER_CONFIG_MAP_ID: 'kube-system/cluster-autoscaler-status';
export const HOSTED_PROVIDER: 'hostedprovider';
export const SAVED_COUNTS: {
    K8S_CLUSTERS: string;
};
