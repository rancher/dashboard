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

  // Management/Rancher resources
  /** Rancher User management resource - `management.cattle.io.user` */
  USER:                          MANAGEMENT.USER,
  /** Rancher Cluster management resource - `management.cattle.io.cluster` */
  CLUSTER:                       MANAGEMENT.CLUSTER,
  /** Rancher Project management resource - `management.cattle.io.project` */
  PROJECT:                       MANAGEMENT.PROJECT,
  /** Rancher RoleTemplate management resource - `management.cattle.io.roletemplate` */
  ROLE_TEMPLATE:                 MANAGEMENT.ROLE_TEMPLATE,
  /** Rancher GlobalRole management resource - `management.cattle.io.globalrole` */
  GLOBAL_ROLE:                   MANAGEMENT.GLOBAL_ROLE,
  /** Rancher GlobalRoleBinding management resource - `management.cattle.io.globalrolebinding` */
  GLOBAL_ROLE_BINDING:           MANAGEMENT.GLOBAL_ROLE_BINDING,
  /** Rancher AuthConfig management resource - `management.cattle.io.authconfig` */
  AUTH_CONFIG:                   MANAGEMENT.AUTH_CONFIG,
  /** Rancher Setting management resource - `management.cattle.io.setting` */
  SETTING:                       MANAGEMENT.SETTING,
  /** Rancher Token management resource - `management.cattle.io.token` */
  TOKEN:                         MANAGEMENT.TOKEN,
  /** Rancher NodeDriver management resource - `management.cattle.io.nodedriver` */
  NODE_DRIVER:                   MANAGEMENT.NODE_DRIVER,
  /** Rancher KontainerDriver management resource - `management.cattle.io.kontainerdriver` */
  KONTAINER_DRIVER:              MANAGEMENT.KONTAINER_DRIVER,
  /** Rancher ClusterRoleTemplateBinding management resource - `management.cattle.io.clusterroletemplatebinding` */
  CLUSTER_ROLE_TEMPLATE_BINDING: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
  /** Rancher ProjectRoleTemplateBinding management resource - `management.cattle.io.projectroletemplatebinding` */
  PROJECT_ROLE_TEMPLATE_BINDING: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,

  // Fleet
  /** Fleet Cluster resource - `fleet.cattle.io.cluster` */
  FLEET_CLUSTER:       FLEET.CLUSTER,
  /** Fleet GitRepo resource - `fleet.cattle.io.gitrepo` */
  FLEET_GIT_REPO:      FLEET.GIT_REPO,
  /** Fleet Bundle resource - `fleet.cattle.io.bundle` */
  FLEET_BUNDLE:        FLEET.BUNDLE,
  /** Fleet ClusterGroup resource - `fleet.cattle.io.clustergroup` */
  FLEET_CLUSTER_GROUP: FLEET.CLUSTER_GROUP,
  /** Fleet Workspace resource - `management.cattle.io.fleetworkspace` */
  FLEET_WORKSPACE:     FLEET.WORKSPACE,

  // Catalog
  /** Catalog App resource - `catalog.cattle.io.app` */
  APP:          CATALOG.APP,
  /** Catalog ClusterRepo resource - `catalog.cattle.io.clusterrepo` */
  CLUSTER_REPO: CATALOG.CLUSTER_REPO,

  // Provisioning (CAPI)
  /** Rancher Provisioning Cluster resource - `provisioning.cattle.io.cluster` */
  RANCHER_CLUSTER:    CAPI.RANCHER_CLUSTER,
  /** Cluster API Cluster resource - `cluster.x-k8s.io.cluster` */
  CAPI_CLUSTER:       CAPI.CAPI_CLUSTER,
  /** Cluster API MachineDeployment resource - `cluster.x-k8s.io.machinedeployment` */
  MACHINE_DEPLOYMENT: CAPI.MACHINE_DEPLOYMENT,
  /** Cluster API Machine resource - `cluster.x-k8s.io.machine` */
  MACHINE:            CAPI.MACHINE,
} as const;

/**
 * Type helper to extract resource type values from K8S constants
 */
export type K8SResourceType = typeof K8S[keyof typeof K8S];
