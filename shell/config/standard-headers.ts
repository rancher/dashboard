/*
 * Strictly-typed mapping of standard table headers with IntelliSense support
 * - Usage: StandardHeaders.state  (returns the header object from table-headers.js)
 * - CamelCase keys available: StandardHeaders.featureDescription (from FEATURE_DESCRIPTION)
 *
 * This file imports everything from `table-headers` and exposes a typed mapping
 * so new headers added to `table-headers.js` are automatically available here.
 */

import * as TableHeaders from './table-headers';

/**
 * Table header configuration object with all possible properties
 */
export interface TableHeader {
  /** Unique identifier for the column */
  name: string;
  /** Translation key for the column label */
  labelKey?: string;
  /** Direct label text (alternative to labelKey) */
  label?: string;
  /** Sort configuration - field name(s) to sort by */
  sort?: string | string[] | false;
  /** Default sort field */
  defaultSort?: boolean;
  /** Value accessor - field path or function */
  value?: string | ((row: any) => any);
  /** Custom getValue function for extracting cell value */
  getValue?: (row: any) => any;
  /** Column width in pixels */
  width?: number;
  /** Default value when field is empty */
  default?: string;
  /** Formatter component name */
  formatter?: string;
  /** Options to pass to the formatter */
  formatterOpts?: Record<string, any>;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Enable/disable search for this column */
  search?: string | string[] | false;
  /** Field(s) to search within */
  searchField?: string | string[];
  /** Show dash when value is empty */
  dashIfEmpty?: boolean;
  /** Can this column be used as a variable */
  canBeVariable?: boolean;
  /** Tooltip text or translation key */
  tooltip?: string;
  /** Breakpoint for responsive hide/show */
  breakpoint?: string;
  /** Skip this column in row selection */
  skipSelect?: boolean;
  /** Delay loading this column's data */
  delayLoading?: boolean;
  /** Enable live updates for this column */
  liveUpdates?: boolean;
  /** Maximum page size to show this column */
  maxPageSize?: number;
}

/**
 * Strictly-typed mapping of all standard table headers with JSDoc
 * Provides IntelliSense-friendly access to header configurations
 *
 * Note: This interface provides strict typing for known headers.
 * Additional runtime keys may exist, accessible via index signature.
 */
export interface IStandardHeaders {
  /** State column - displays resource state with badge formatter */
  state: TableHeader;
  /** User state column - displays user-specific state */
  userState: TableHeader;
  /** Download column - right-aligned download action */
  download: TableHeader;
  /** Internal/External IP column for nodes */
  internalExternalIp: TableHeader;
  /** Name column - displays resource name with link */
  name: TableHeader;
  /** Project namespaces name column with search */
  projectNamespacesName: TableHeader;
  /** Logging output providers list */
  loggingOutputProviders: TableHeader;
  /** Simple name column without link */
  simpleName: TableHeader;
  /** Effect column for taints */
  effect: TableHeader;
  /** Storage class provisioner column */
  storageClassProvisioner: TableHeader;
  /** Storage class default flag with checkbox */
  storageClassDefault: TableHeader;
  /** Persistent volume source column */
  persistentVolumeSource: TableHeader;
  /** Persistent volume claim link column */
  persistentVolumeClaim: TableHeader;
  /** Output references column */
  output: TableHeader;
  /** Configured providers list */
  configuredProviders: TableHeader;
  /** Cluster output references column */
  clusterOutput: TableHeader;
  /** ID column without link */
  idUnlinked: TableHeader;
  /** Name column without link */
  nameUnlinked: TableHeader;
  /** Namespace column with link */
  namespace: TableHeader;
  /** Node column with link */
  node: TableHeader;
  /** Node name column */
  nodeName: TableHeader;
  /** Roles column */
  roles: TableHeader;
  /** Version column */
  version: TableHeader;
  /** CPU usage percentage bar */
  cpu: TableHeader;
  /** RAM usage percentage bar */
  ram: TableHeader;
  /** Principal column with formatter */
  principal: TableHeader;
  /** Pods usage percentage bar */
  pods: TableHeader;
  /** Age column with live date formatter */
  age: TableHeader;
  /** Age column for Norman resources */
  ageNorman: TableHeader;
  /** Creation date column */
  creationDate: TableHeader;
  /** Description column */
  description: TableHeader;
  /** Namespace snapshot quota column */
  nsSnapshotQuota: TableHeader;
  /** Duration column with live formatter */
  duration: TableHeader;
  /** Image name column */
  imageName: TableHeader;
  /** Pod images column */
  podImages: TableHeader;
  /** Pod restarts column with live updates */
  podRestarts: TableHeader;
  /** Scale column (desired/actual replicas) */
  scale: TableHeader;
  /** Simple scale column (count only) */
  simpleScale: TableHeader;
  /** Success column - right-aligned */
  success: TableHeader;
  /** Request rate column */
  reqRate: TableHeader;
  /** P95 latency column */
  p95: TableHeader;
  /** Keys column for secrets/configmaps */
  keys: TableHeader;
  /** Secret data preview column */
  secretData: TableHeader;
  /** Secret origin column */
  secretOrigin: TableHeader;
  /** Target kind column */
  targetKind: TableHeader;
  /** Target column */
  target: TableHeader;
  /** Username column */
  username: TableHeader;
  /** User display name column */
  userDisplayName: TableHeader;
  /** User provider column */
  userProvider: TableHeader;
  /** User last login with live date */
  userLastLogin: TableHeader;
  /** User disabled in countdown */
  userDisabledIn: TableHeader;
  /** User deleted in countdown */
  userDeletedIn: TableHeader;
  /** User ID column with link */
  userId: TableHeader;
  /** Address column */
  address: TableHeader;
  /** Simple type column */
  simpleType: TableHeader;
  /** Image size column with Si formatter */
  imageSize: TableHeader;
  /** Type column */
  type: TableHeader;
  /** Sub-type column */
  subType: TableHeader;
  /** Event type column */
  eventType: TableHeader;
  /** Status column */
  status: TableHeader;
  /** Last seen time column */
  lastSeenTime: TableHeader;
  /** Event first seen time column */
  eventFirstSeenTime: TableHeader;
  /** Event last seen time column (default sort) */
  eventLastSeenTime: TableHeader;
  /** Last heartbeat time with live date */
  lastHeartbeatTime: TableHeader;
  /** Reason column */
  reason: TableHeader;
  /** Object column with involved object link */
  object: TableHeader;
  /** Reclaim policy column */
  reclaimPolicy: TableHeader;
  /** PV reason column */
  pvReason: TableHeader;
  /** Message column */
  message: TableHeader;
  /** Key column */
  key: TableHeader;
  /** Value column */
  value: TableHeader;
  /** Built-in flag column with icon */
  builtIn: TableHeader;
  /** Cluster creator default flag */
  clusterCreatorDefault: TableHeader;
  /** RBAC default flag with checkbox */
  rbacDefault: TableHeader;
  /** RBAC built-in flag with checkbox */
  rbacBuiltin: TableHeader;
  /** Resource column */
  resource: TableHeader;
  /** API group column */
  apiGroup: TableHeader;
  /** Ingress class name column */
  ingressClass: TableHeader;
  /** Ingress default backend checkbox */
  ingressDefaultBackend: TableHeader;
  /** Ingress target column */
  ingressTarget: TableHeader;
  /** Service spec type column */
  specType: TableHeader;
  /** Target port column */
  targetPort: TableHeader;
  /** Selector column with key-value formatter */
  selector: TableHeader;
  /** Chart column */
  chart: TableHeader;
  /** Chart upgrade available column */
  chartUpgrade: TableHeader;
  /** Resources count column */
  resources: TableHeader;
  /** URL column */
  url: TableHeader;
  /** Last updated with live date */
  lastUpdated: TableHeader;
  /** Workspace column */
  workspace: TableHeader;
  /** Workload images column */
  workloadImages: TableHeader;
  /** Workload endpoints column */
  workloadEndpoints: TableHeader;
  /** Workload health scale column with live updates */
  workloadHealthScale: TableHeader;
  /** Fleet summary graph column */
  fleetSummary: TableHeader;
  /** Fleet application type column */
  fleetApplicationType: TableHeader;
  /** Fleet application source column */
  fleetApplicationSource: TableHeader;
  /** Fleet application target column */
  fleetApplicationTarget: TableHeader;
  /** Fleet application clusters ready column */
  fleetApplicationClustersReady: TableHeader;
  /** Fleet application resources summary graph */
  fleetApplicationResourcesSummary: TableHeader;
  /** Fleet repo cluster summary graph */
  fleetRepoClusterSummary: TableHeader;
  /** Fleet repo per-cluster state column */
  fleetRepoPerClusterState: TableHeader;
  /** App summary graph column */
  appSummary: TableHeader;
  /** Constraint violation constraint link */
  constraintViolationConstraintLink: TableHeader;
  /** Constraint violation resource link */
  constraintViolationResourceLink: TableHeader;
  /** Constraint violation type */
  constraintViolationType: TableHeader;
  /** Constraint violation namespace */
  constraintViolationNamespace: TableHeader;
  /** Constraint violation message */
  constraintViolationMessage: TableHeader;
  /** Constraint violation template link */
  constraintViolationTemplateLink: TableHeader;
  /** Constraint violation count with quality formatter */
  constraintViolationCount: TableHeader;
  /** Receiver providers list */
  receiverProviders: TableHeader;
  /** Configured receiver link */
  configuredReceiver: TableHeader;
  /** Group name with principal formatter */
  groupName: TableHeader;
  /** Group role names column */
  groupRoleName: TableHeader;
  /** HPA reference column */
  hpaReference: TableHeader;
  /** Minimum replica count */
  minReplica: TableHeader;
  /** Maximum replica count */
  maxReplica: TableHeader;
  /** Current replica count */
  currentReplica: TableHeader;
  /** Expiry state with live badge */
  expiryState: TableHeader;
  /** Access key ID column */
  accessKey: TableHeader;
  /** Scope column */
  scope: TableHeader;
  /** Scope column for Norman resources */
  scopeNorman: TableHeader;
  /** Norman key deprecation flag */
  normanKeyDeprecation: TableHeader;
  /** Expires column with live date */
  expires: TableHeader;
  /** Last used column with live date */
  lastUsed: TableHeader;
  /** Restart required checkbox */
  restart: TableHeader;
  /** Role column */
  role: TableHeader;
  /** Feature description with translation */
  featureDescription: TableHeader;
  /** State column for Norman resources */
  stateNorman: TableHeader;
  /** Kubernetes node OS column */
  kubeNodeOs: TableHeader;
  /** Machine node OS column */
  machineNodeOs: TableHeader;
  /** Management node OS column */
  managementNodeOs: TableHeader;
  /** Fleet bundle last updated time */
  fleetBundleLastUpdated: TableHeader;
  /** Fleet repo target column */
  fleetRepoTarget: TableHeader;
  /** Fleet repo column */
  fleetRepo: TableHeader;
  /** Project column */
  project: TableHeader;
  /** Autoscaler enabled column */
  autoscalerEnabled: TableHeader;

  /** Index signature for runtime-added headers */
  [key: string]: TableHeader;
}

// Build the runtime mapping
const _headers: Record<string, TableHeader> = {};

Object.keys(TableHeaders).forEach((exportName) => {
  const header = (TableHeaders as any)[exportName];

  if (!header || typeof header !== 'object') {
    return;
  }

  // Skip array exports (like UI_PLUGIN_CATALOG)
  if (Array.isArray(header)) {
    return;
  }

  // Add by header.name if present
  if (typeof header.name === 'string') {
    _headers[header.name] = header;
  }

  // Add by export constant name (lowercased)
  _headers[exportName.toLowerCase()] = header;

  // Add camelCase version (e.g. FEATURE_DESCRIPTION -> featureDescription)
  const parts = exportName.toLowerCase().split(/[_\-\s]+/).filter(Boolean);

  if (parts.length) {
    const camel = parts.slice(1).reduce((acc, p) => acc + p.charAt(0).toUpperCase() + p.slice(1), parts[0]);

    if (!_headers[camel]) {
      _headers[camel] = header;
    }
  }
});

/**
 * Runtime mapping of all standard table headers
 * Provides typed access via IntelliSense for all header configurations
 *
 * @example
 * import StandardHeaders from '@shell/config/standard-headers';
 *
 * const columns = [
 *   StandardHeaders.state,
 *   StandardHeaders.name,
 *   StandardHeaders.age
 * ];
 */
export const StandardHeaders = _headers as IStandardHeaders;

/**
 * Get a header by key with runtime lookup
 * @param key - Header key (can be name, constant name, or camelCase)
 * @returns The header configuration or undefined
 * @example
 * import { getStandardHeader } from '@shell/config/standard-headers';
 * const state = getStandardHeader('state');
 */
export function getStandardHeader(key: string): TableHeader | undefined {
  return _headers[key];
}

/**
 * List of all available header keys
 */
export const StandardHeaderKeys = Object.keys(_headers) as string[];

export default StandardHeaders;
