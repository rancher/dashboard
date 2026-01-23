/**
 * Column Builder for Resource List Tables
 *
 * This module provides a fluent API for defining table columns in resource lists.
 * No need to import column definitions - all standard columns are built-in!
 *
 * @example Simple usage with standard columns
 * columns: ['state', 'name', 'namespace', 'age']
 *
 * @example With customization
 * columns: [
 *   'state',
 *   'name',
 *   column('targetPort').noSort().noSearch(),
 *   'age'
 * ]
 */

import * as TableHeaders from '@shell/config/table-headers';
import * as PaginationHeaders from '@shell/config/pagination-table-headers';

/**
 * Standard column identifiers that are available out-of-the-box.
 * These map to pre-configured column definitions.
 */
export type StandardColumnKey =
  // Core Columns
  | 'state' // Resource state badge (Active, Error, etc.)
  | 'name' // Resource name with link to detail page
  | 'namespace' // Kubernetes namespace
  | 'age' // Time since resource creation

  // Node & Resource Info
  | 'node' // Node name with link
  | 'nodeName' // Simple node name display
  | 'version' // Version information
  | 'cpu' // CPU allocation/usage
  | 'ram' // Memory allocation/usage
  | 'internalExternalIp' // IP addresses for nodes

  // Workload Columns
  | 'type' // Resource type
  | 'subType' // Resource sub-type
  | 'pods' // Pod count/status
  | 'scale' // Replica scale with ready count
  | 'simpleScale' // Simple scale display
  | 'workloadImages' // Container images
  | 'workloadEndpoints' // Service endpoints
  | 'podImages' // Pod container images
  | 'podRestarts' // Pod restart count
  | 'workloadHealthScale' // Health indicator with scale

  // Storage Columns
  | 'persistentVolumeSource' // PV source/provisioner
  | 'persistentVolumeClaim' // Associated PVC
  | 'reclaimPolicy' // PV reclaim policy
  | 'storageClass' // Storage class name
  | 'storageClassProvisioner' // Storage provisioner
  | 'storageClassDefault' // Default storage class indicator

  // Secret & ConfigMap
  | 'keys' // ConfigMap/Secret key count
  | 'secretData' // Secret data indicator
  | 'secretProjectScoped' // Project-scoped secret indicator

  // Network Columns
  | 'ingressTarget' // Ingress target hosts
  | 'ingressDefaultBackend' // Ingress default backend
  | 'ingressClass' // Ingress class
  | 'specType' // Service type (ClusterIP, NodePort, etc.)
  | 'targetPort' // Service target port
  | 'selector' // Service selector

  // Event Columns
  | 'eventType' // Event type
  | 'eventFirstSeenTime' // First occurrence
  | 'eventLastSeenTime' // Last occurrence
  | 'reason' // Event reason
  | 'message' // Event message
  | 'object' // Related object
  | 'duration' // Duration

  // HPA Columns
  | 'hpaReference' // HPA target reference
  | 'minReplica' // Minimum replicas
  | 'maxReplica' // Maximum replicas
  | 'currentReplica' // Current replicas

  // App/Chart Columns
  | 'chart' // Helm chart name
  | 'chartUpgrade' // Available chart upgrade
  | 'appSummary' // App summary info
  | 'resources' // Resource list
  | 'url' // URL/endpoint

  // User/Auth Columns
  | 'username' // User name
  | 'userDisplayName' // User display name
  | 'userProvider' // Auth provider
  | 'userLastLogin' // Last login time
  | 'userId' // User ID
  | 'principal' // Principal name
  | 'roles' // User roles

  // Fleet Columns
  | 'fleetSummary' // Fleet deployment summary
  | 'fleetApplicationType' // Fleet app type
  | 'workspace' // Fleet workspace

  // Misc Columns
  | 'description' // Resource description
  | 'lastUpdated' // Last update time
  | 'creationDate' // Creation date
  | 'status' // Status field
  | 'builtIn' // Built-in resource indicator
  | 'rbacDefault'; // RBAC default indicator

/**
 * Column configuration object
 */
export interface ColumnConfig {
  name: string;
  labelKey?: string;
  label?: string;
  value?: string | string[];
  getValue?: (row: any) => any;
  sort?: string[] | string | false;
  search?: string[] | string | false;
  width?: number;
  formatter?: string;
  formatterOpts?: any;
  dashIfEmpty?: boolean;
  align?: 'left' | 'right' | 'center';
  [key: string]: any;
}

export type PaginationOverrides = {
  [key: string]: StandardColumnKey | ColumnConfig;
};

/**
 * Headers configuration for a resource type
 */
export interface HeadersConfig {
  /**
   * Column definitions - can be:
   * - Standard column key (e.g., 'state', 'name')
   * - Column builder instance
   * - Custom column config object
   */
  columns?: (StandardColumnKey | any | ColumnConfig)[];

  /**
   * Pagination behavior:
   * - 'auto': Automatically map to Steve/SSP equivalents (recommended)
   * - 'same': Use the same columns for pagination
   * - 'custom': Define custom pagination columns
   */
  pagination?: 'auto' | 'same' | 'custom' | PaginationOverrides;

  /**
   * Use a preset pattern:
   * - 'namespaced': STATE, NAME, NAMESPACE, AGE
   * - 'cluster': STATE, NAME, AGE
   * - 'workload': STATE, NAME, NAMESPACE, TYPE, IMAGES, ENDPOINTS, AGE
   * - 'storage': STATE, NAME, CAPACITY, STORAGE_CLASS, AGE
   */
  preset?: 'namespaced' | 'cluster' | 'workload' | 'storage';

  /**
   * Additional columns to add to the preset
   */
  add?: (StandardColumnKey | any | ColumnConfig)[];

  /**
   * Override specific column properties
   */
  override?: {
    [key: string]: Partial<ColumnConfig>;
  };
}

/**
 * Column builder class for fluent API
 */
export class ColumnBuilder {
  private config: ColumnConfig;

  constructor(keyOrConfig: StandardColumnKey | ColumnConfig) {
    if (typeof keyOrConfig === 'string') {
      const standardCol = resolveStandardColumn(keyOrConfig);

      if (!standardCol) {
        // eslint-disable-next-line no-console
        console.warn(`Unknown standard column: "${ keyOrConfig }"`);
        this.config = { name: keyOrConfig };
      } else {
        this.config = { ...standardCol };
      }
    } else {
      this.config = { ...keyOrConfig };
    }
  }

  /**
   * Disable sorting for this column
   */
  noSort(): this {
    this.config.sort = false;

    return this;
  }

  /**
   * Set sort path(s) for this column
   */
  sort(path: string | string[]): this {
    this.config.sort = Array.isArray(path) ? path : [path];

    return this;
  }

  /**
   * Disable searching for this column
   */
  noSearch(): this {
    this.config.search = false;

    return this;
  }

  /**
   * Set search path(s) for this column
   */
  search(path: string | string[]): this {
    this.config.search = Array.isArray(path) ? path : [path];

    return this;
  }

  /**
   * Set column width
   */
  width(w: number): this {
    this.config.width = w;

    return this;
  }

  /**
   * Set custom label
   */
  label(label: string): this {
    this.config.label = label;

    return this;
  }

  /**
   * Set label translation key
   */
  labelKey(key: string): this {
    this.config.labelKey = key;

    return this;
  }

  /**
   * Set value path or getter function
   */
  value(pathOrGetter: string | ((row: any) => any)): this {
    if (typeof pathOrGetter === 'function') {
      this.config.getValue = pathOrGetter;
    } else {
      this.config.value = pathOrGetter;
    }

    return this;
  }

  /**
   * Set formatter component
   */
  formatter(name: string, opts?: any): this {
    this.config.formatter = name;
    if (opts) {
      this.config.formatterOpts = opts;
    }

    return this;
  }

  /**
   * Show dash if value is empty
   */
  dashIfEmpty(): this {
    this.config.dashIfEmpty = true;

    return this;
  }

  /**
   * Set column alignment
   */
  align(alignment: 'left' | 'right' | 'center'): this {
    this.config.align = alignment;

    return this;
  }

  /**
   * Override any property
   */
  set(key: string, value: any): this {
    (this.config as any)[key] = value;

    return this;
  }

  /**
   * Merge multiple properties
   */
  merge(props: Partial<ColumnConfig>): this {
    Object.assign(this.config, props);

    return this;
  }

  /**
   * Build the final configuration
   */
  build(): ColumnConfig {
    return this.config;
  }

  /**
   * Get the configuration (alias for build)
   */
  toConfig(): ColumnConfig {
    return this.config;
  }
}

/**
 * Create a column builder instance
 *
 * @example
 * column('state')
 * column('targetPort').noSort().noSearch()
 * column({ name: 'custom', label: 'Custom', value: 'customField' })
 */
export function column(
  keyOrConfig: StandardColumnKey | ColumnConfig
): ColumnBuilder {
  return new ColumnBuilder(keyOrConfig);
}

/**
 * Resolve a standard column key to its configuration
 */
function resolveStandardColumn(key: StandardColumnKey): ColumnConfig | null {
  // Map friendly keys to TableHeaders exports
  const mapping: Record<string, keyof typeof TableHeaders> = {
    state:                   'STATE',
    name:                    'NAME',
    namespace:               'NAMESPACE',
    age:                     'AGE',
    node:                    'NODE',
    nodeName:                'NODE_NAME',
    version:                 'VERSION',
    cpu:                     'CPU',
    ram:                     'RAM',
    internalExternalIp:      'INTERNAL_EXTERNAL_IP',
    type:                    'TYPE',
    subType:                 'SUB_TYPE',
    pods:                    'PODS',
    scale:                   'SCALE',
    simpleScale:             'SIMPLE_SCALE',
    workloadImages:          'WORKLOAD_IMAGES',
    workloadEndpoints:       'WORKLOAD_ENDPOINTS',
    podImages:               'POD_IMAGES',
    podRestarts:             'POD_RESTARTS',
    workloadHealthScale:     'WORKLOAD_HEALTH_SCALE',
    persistentVolumeSource:  'PERSISTENT_VOLUME_SOURCE',
    persistentVolumeClaim:   'PERSISTENT_VOLUME_CLAIM',
    reclaimPolicy:           'RECLAIM_POLICY',
    storageClassProvisioner: 'STORAGE_CLASS_PROVISIONER',
    storageClassDefault:     'STORAGE_CLASS_DEFAULT',
    keys:                    'KEYS',
    secretData:              'SECRET_DATA',
    secretProjectScoped:     'SECRET_PROJECT_SCOPED',
    ingressTarget:           'INGRESS_TARGET',
    ingressDefaultBackend:   'INGRESS_DEFAULT_BACKEND',
    ingressClass:            'INGRESS_CLASS',
    specType:                'SPEC_TYPE',
    targetPort:              'TARGET_PORT',
    selector:                'SELECTOR',
    eventType:               'EVENT_TYPE',
    eventLastSeenTime:       'EVENT_LAST_SEEN_TIME',
    reason:                  'REASON',
    message:                 'MESSAGE',
    object:                  'OBJECT',
    duration:                'DURATION',
    hpaReference:            'HPA_REFERENCE',
    minReplica:              'MIN_REPLICA',
    maxReplica:              'MAX_REPLICA',
    currentReplica:          'CURRENT_REPLICA',
    chart:                   'CHART',
    chartUpgrade:            'CHART_UPGRADE',
    appSummary:              'APP_SUMMARY',
    resources:               'RESOURCES',
    url:                     'URL',
    username:                'USERNAME',
    userDisplayName:         'USER_DISPLAY_NAME',
    userProvider:            'USER_PROVIDER',
    userLastLogin:           'USER_LAST_LOGIN',
    userId:                  'USER_ID',
    principal:               'PRINCIPAL',
    roles:                   'ROLES',
    fleetSummary:            'FLEET_SUMMARY',
    fleetApplicationType:    'FLEET_APPLICATION_TYPE',
    workspace:               'WORKSPACE',
    description:             'DESCRIPTION',
    lastUpdated:             'LAST_UPDATED',
    creationDate:            'CREATION_DATE',
    status:                  'STATUS',
    builtIn:                 'BUILT_IN',
    rbacDefault:             'RBAC_DEFAULT',
  };

  const headerKey = mapping[key];

  if (!headerKey || !(headerKey in TableHeaders)) {
    return null;
  }

  return (TableHeaders as any)[headerKey];
}

/**
 * Resolve pagination column key
 */
function resolvePaginationColumn(key: StandardColumnKey): ColumnConfig | null {
  // Map to Steve/SSP column equivalents
  const mapping: Record<string, keyof typeof PaginationHeaders> = {
    state:              'STEVE_STATE_COL',
    name:               'STEVE_NAME_COL',
    namespace:          'STEVE_NAMESPACE_COL',
    age:                'STEVE_AGE_COL',
    eventType:          'STEVE_EVENT_TYPE',
    eventFirstSeenTime: 'STEVE_EVENT_FIRST_SEEN',
    eventLastSeenTime:  'STEVE_EVENT_LAST_SEEN',
    object:             'STEVE_EVENT_OBJECT',
  };

  const headerKey = mapping[key];

  if (!headerKey || !(headerKey in PaginationHeaders)) {
    // Fall back to regular column
    return resolveStandardColumn(key);
  }

  return (PaginationHeaders as any)[headerKey];
}

/**
 * Process headers configuration into arrays for DSL
 */
export function processHeadersConfig(config: HeadersConfig): {
  defaults: ColumnConfig[];
  pagination: ColumnConfig[];
} {
  let columns: (StandardColumnKey | ColumnBuilder | ColumnConfig)[] = [];

  // Handle presets
  if (config.preset) {
    const presets: Record<string, StandardColumnKey[]> = {
      namespaced: ['state', 'name', 'namespace', 'age'],
      cluster:    ['state', 'name', 'age'],
      workload:   [
        'state',
        'name',
        'namespace',
        'type',
        'workloadImages',
        'workloadEndpoints',
        'age',
      ],
      storage: ['state', 'name', 'namespace', 'age'],
    };

    columns = [...(presets[config.preset] || [])];

    // Add additional columns if specified
    if (config.add) {
      columns.push(...config.add);
    }
  } else if (config.columns) {
    columns = config.columns;
  }

  // Resolve columns to config objects
  const defaults: ColumnConfig[] = columns.map((col) => {
    let resolved: ColumnConfig;

    if (typeof col === 'string') {
      resolved = resolveStandardColumn(col) || { name: col };
    } else if (col instanceof ColumnBuilder) {
      resolved = col.build();
    } else {
      resolved = col;
    }

    // Apply overrides if they exist
    if (config.override && (config.override as any)[resolved.name]) {
      resolved = { ...resolved, ...(config.override as any)[resolved.name] };
    }

    return resolved;
  });

  // Process pagination
  let pagination: ColumnConfig[] = [];

  if (!config.pagination || config.pagination === 'auto') {
    // Auto-map to pagination columns
    pagination = columns.map((col) => {
      const colKey =
        typeof col === 'string' ? col : col instanceof ColumnBuilder ? col.build().name : col.name;
      const standardKey = Object.entries(resolveStandardColumn as any).find(
        ([_, v]) => v === colKey
      )?.[0] as StandardColumnKey;

      return (
        resolvePaginationColumn(standardKey || (colKey as StandardColumnKey)) ||
        resolveStandardColumn(standardKey || (colKey as StandardColumnKey)) || { name: colKey }
      );
    });
  } else if (config.pagination === 'same') {
    pagination = [...defaults];
  } else if (typeof config.pagination === 'object') {
    // Custom pagination overrides
    pagination = defaults.map((defaultCol) => {
      const override = (config.pagination as any)[defaultCol.name];

      if (!override) {
        return defaultCol;
      }

      if (typeof override === 'string') {
        return (
          resolveStandardColumn(override as StandardColumnKey) || defaultCol
        );
      }

      return { ...defaultCol, ...override };
    });
  }

  return { defaults, pagination };
}
