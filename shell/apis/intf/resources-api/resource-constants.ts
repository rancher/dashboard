/**
 * Resource type constants for Kubernetes and Rancher resources.
 * Use these constants instead of string literals for type safety and autocomplete.
 *
 * This file dynamically generates K8S constants from shell/config/types.js
 * to avoid duplication and ensure consistency.
 *
 * @example
 * ```ts
 * import { K8S } from '@shell/apis';
 *
 * resources.cluster.list(K8S.POD);
 * resources.cluster.list(K8S.DEPLOYMENT);
 * resources.mgmt.list(K8S.USER);
 * ```
 */

import {
  POD,
  SERVICE,
  CONFIG_MAP,
  SECRET,
  NAMESPACE,
  NODE,
  PV,
  PVC,
  SERVICE_ACCOUNT,
  EVENT,
  ENDPOINTS,
  LIMIT_RANGE,
  RESOURCE_QUOTA,
  WORKLOAD_TYPES,
  HPA,
  INGRESS,
  NETWORK_POLICY,
  INGRESS_CLASS,
  RBAC,
  STORAGE_CLASS,
  CSI_DRIVER,
  POD_DISRUPTION_BUDGET,
  MANAGEMENT,
  FLEET,
  CATALOG,
  CAPI,
} from '@shell/config/types';

/**
 * Kubernetes core and common resource types
 * Dynamically generated from shell/config/types.js
 */
export const K8S = {
  // Core resources
  POD,
  SERVICE,
  CONFIG_MAP,
  SECRET,
  NAMESPACE,
  NODE,
  PV,
  PVC,
  SERVICE_ACCOUNT,
  EVENT,
  ENDPOINTS,
  LIMIT_RANGE,
  RESOURCE_QUOTA,

  // Apps/Workloads
  DEPLOYMENT:             WORKLOAD_TYPES.DEPLOYMENT,
  STATEFUL_SET:           WORKLOAD_TYPES.STATEFUL_SET,
  DAEMON_SET:             WORKLOAD_TYPES.DAEMON_SET,
  REPLICA_SET:            WORKLOAD_TYPES.REPLICA_SET,
  REPLICATION_CONTROLLER: WORKLOAD_TYPES.REPLICATION_CONTROLLER,

  // Batch
  JOB:      WORKLOAD_TYPES.JOB,
  CRON_JOB: WORKLOAD_TYPES.CRON_JOB,

  // Networking
  INGRESS,
  NETWORK_POLICY,
  INGRESS_CLASS,

  // RBAC
  ROLE:                 RBAC.ROLE,
  ROLE_BINDING:         RBAC.ROLE_BINDING,
  CLUSTER_ROLE:         RBAC.CLUSTER_ROLE,
  CLUSTER_ROLE_BINDING: RBAC.CLUSTER_ROLE_BINDING,

  // Storage
  STORAGE_CLASS,
  CSI_DRIVER,

  // Policy
  POD_DISRUPTION_BUDGET,

  // Autoscaling
  HPA,

  // Management/Rancher resources
  USER:                          MANAGEMENT.USER,
  CLUSTER:                       MANAGEMENT.CLUSTER,
  PROJECT:                       MANAGEMENT.PROJECT,
  ROLE_TEMPLATE:                 MANAGEMENT.ROLE_TEMPLATE,
  GLOBAL_ROLE:                   MANAGEMENT.GLOBAL_ROLE,
  GLOBAL_ROLE_BINDING:           MANAGEMENT.GLOBAL_ROLE_BINDING,
  AUTH_CONFIG:                   MANAGEMENT.AUTH_CONFIG,
  SETTING:                       MANAGEMENT.SETTING,
  TOKEN:                         MANAGEMENT.TOKEN,
  NODE_DRIVER:                   MANAGEMENT.NODE_DRIVER,
  KONTAINER_DRIVER:              MANAGEMENT.KONTAINER_DRIVER,
  CLUSTER_ROLE_TEMPLATE_BINDING: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
  PROJECT_ROLE_TEMPLATE_BINDING: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,

  // Fleet
  FLEET_CLUSTER:       FLEET.CLUSTER,
  FLEET_GIT_REPO:      FLEET.GIT_REPO,
  FLEET_BUNDLE:        FLEET.BUNDLE,
  FLEET_CLUSTER_GROUP: FLEET.CLUSTER_GROUP,
  FLEET_WORKSPACE:     FLEET.WORKSPACE,

  // Catalog
  APP:          CATALOG.APP,
  CLUSTER_REPO: CATALOG.CLUSTER_REPO,

  // Provisioning (CAPI)
  RANCHER_CLUSTER:    CAPI.RANCHER_CLUSTER,
  CAPI_CLUSTER:       CAPI.CAPI_CLUSTER,
  MACHINE_DEPLOYMENT: CAPI.MACHINE_DEPLOYMENT,
  MACHINE:            CAPI.MACHINE,
} as const;

/**
 * Type helper to extract resource type values
 */
export type K8SResourceType = typeof K8S[keyof typeof K8S];
