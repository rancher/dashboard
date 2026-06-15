/**
 * Resource type constants for Kubernetes and Rancher resources.
 * Use these constants instead of string literals for type safety and autocomplete.
 *
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * resources.cluster.find(K8S.POD, 'default/my-pod');
 * resources.cluster.findAll(K8S.DEPLOYMENT);
 * resources.mgmt.findAll(K8S.USER);
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
} from '@shell/config/types';

/**
 * Kubernetes core and common resource types
 */
export const K8S = {
  // Core resources
  /** Kubernetes Pod resource - `pod` */
  POD,
  /** Kubernetes Service resource - `service` */
  SERVICE,
  /** Kubernetes ConfigMap resource - `configmap` */
  CONFIG_MAP,
  /** Kubernetes Secret resource - `secret` */
  SECRET,
  /** Kubernetes Namespace resource - `namespace` */
  NAMESPACE,
  /** Kubernetes Node resource - `node` */
  NODE,
  /** Kubernetes PersistentVolume resource - `persistentvolume` */
  PV,
  /** Kubernetes PersistentVolumeClaim resource - `persistentvolumeclaim` */
  PVC,
  /** Kubernetes ServiceAccount resource - `serviceaccount` */
  SERVICE_ACCOUNT,
  /** Kubernetes Event resource - `event` */
  EVENT,
  /** Kubernetes Endpoints resource - `endpoints` */
  ENDPOINTS,
  /** Kubernetes LimitRange resource - `limitrange` */
  LIMIT_RANGE,
  /** Kubernetes ResourceQuota resource - `resourcequota` */
  RESOURCE_QUOTA,

  // Apps/Workloads
  /** Kubernetes Deployment workload - `apps.deployment` */
  DEPLOYMENT:             WORKLOAD_TYPES.DEPLOYMENT,
  /** Kubernetes StatefulSet workload - `apps.statefulset` */
  STATEFUL_SET:           WORKLOAD_TYPES.STATEFUL_SET,
  /** Kubernetes DaemonSet workload - `apps.daemonset` */
  DAEMON_SET:             WORKLOAD_TYPES.DAEMON_SET,
  /** Kubernetes ReplicaSet workload - `apps.replicaset` */
  REPLICA_SET:            WORKLOAD_TYPES.REPLICA_SET,
  /** Kubernetes ReplicationController workload - `replicationcontroller` */
  REPLICATION_CONTROLLER: WORKLOAD_TYPES.REPLICATION_CONTROLLER,

  // Batch
  /** Kubernetes Job batch resource - `batch.job` */
  JOB:      WORKLOAD_TYPES.JOB,
  /** Kubernetes CronJob batch resource - `batch.cronjob` */
  CRON_JOB: WORKLOAD_TYPES.CRON_JOB,

  // Networking
  /** Kubernetes Ingress networking resource - `networking.k8s.io.ingress` */
  INGRESS,
  /** Kubernetes NetworkPolicy resource - `networking.k8s.io.networkpolicy` */
  NETWORK_POLICY,
  /** Kubernetes IngressClass resource - `networking.k8s.io.ingressclass` */
  INGRESS_CLASS,

  // RBAC
  /** Kubernetes Role RBAC resource - `rbac.authorization.k8s.io.role` */
  ROLE:                 RBAC.ROLE,
  /** Kubernetes RoleBinding RBAC resource - `rbac.authorization.k8s.io.rolebinding` */
  ROLE_BINDING:         RBAC.ROLE_BINDING,
  /** Kubernetes ClusterRole RBAC resource - `rbac.authorization.k8s.io.clusterrole` */
  CLUSTER_ROLE:         RBAC.CLUSTER_ROLE,
  /** Kubernetes ClusterRoleBinding RBAC resource - `rbac.authorization.k8s.io.clusterrolebinding` */
  CLUSTER_ROLE_BINDING: RBAC.CLUSTER_ROLE_BINDING,

  // Storage
  /** Kubernetes StorageClass storage resource - `storage.k8s.io.storageclass` */
  STORAGE_CLASS,
  /** Kubernetes CSIDriver storage resource - `storage.k8s.io.csidriver` */
  CSI_DRIVER,

  // Policy
  /** Kubernetes PodDisruptionBudget policy resource - `policy.poddisruptionbudget` */
  POD_DISRUPTION_BUDGET,

  // Autoscaling
  /** Kubernetes HorizontalPodAutoscaler resource - `autoscaling.horizontalpodautoscaler` */
  HPA,

  // Management/Rancher resources (public API: https://ranchermanager.docs.rancher.com/api/api-reference)
  /** Rancher User management resource - `management.cattle.io.user` */
  USER:                          MANAGEMENT.USER,
  /** Rancher Project management resource - `management.cattle.io.project` */
  PROJECT:                       MANAGEMENT.PROJECT,
  /** Rancher RoleTemplate management resource - `management.cattle.io.roletemplate` */
  ROLE_TEMPLATE:                 MANAGEMENT.ROLE_TEMPLATE,
  /** Rancher GlobalRole management resource - `management.cattle.io.globalrole` */
  GLOBAL_ROLE:                   MANAGEMENT.GLOBAL_ROLE,
  /** Rancher GlobalRoleBinding management resource - `management.cattle.io.globalrolebinding` */
  GLOBAL_ROLE_BINDING:           MANAGEMENT.GLOBAL_ROLE_BINDING,
  /** Rancher ClusterRoleTemplateBinding management resource - `management.cattle.io.clusterroletemplatebinding` */
  CLUSTER_ROLE_TEMPLATE_BINDING: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
  /** Rancher ProjectRoleTemplateBinding management resource - `management.cattle.io.projectroletemplatebinding` */
  PROJECT_ROLE_TEMPLATE_BINDING: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
} as const;

/**
 * Type helper to extract resource type values from K8S constants.
 * Check **{@link K8S}** constant documentation
 */
export type K8SResourceType = typeof K8S[keyof typeof K8S];
