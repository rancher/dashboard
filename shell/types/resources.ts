/**
 * Common Kubernetes and Rancher resource type definitions.
 * These types can be used with the Resources API generics for type-safe resource management.
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 * import type { Pod, Deployment } from '@shell/types/resources';
 *
 * const resources = useResources();
 * const pods = await resources.cluster.list<Pod>(K8S.Pod);
 * ```
 */

import { ResourceBase } from '@shell/apis/intf/resources-api/resource-base';

/**
 * Kubernetes Pod resource
 */
export interface Pod extends ResourceBase {
  spec?: {
    containers?: Array<{
      name: string;
      image: string;
      ports?: Array<{ containerPort: number; protocol?: string }>;
      env?: Array<{ name: string; value?: string; valueFrom?: any }>;
      resources?: {
        limits?: Record<string, string>;
        requests?: Record<string, string>;
      };
      [key: string]: any;
    }>;
    volumes?: Array<any>;
    nodeName?: string;
    serviceAccountName?: string;
    [key: string]: any;
  };
  status?: {
    phase?: string;
    conditions?: Array<any>;
    podIP?: string;
    startTime?: string;
    containerStatuses?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes Deployment resource
 */
export interface Deployment extends ResourceBase {
  spec?: {
    replicas?: number;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Pod['spec'];
    };
    strategy?: {
      type?: string;
      rollingUpdate?: {
        maxSurge?: number | string;
        maxUnavailable?: number | string;
      };
    };
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    updatedReplicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes Service resource
 */
export interface Service extends ResourceBase {
  spec?: {
    type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
    selector?: Record<string, string>;
    ports?: Array<{
      name?: string;
      protocol?: string;
      port: number;
      targetPort?: number | string;
      nodePort?: number;
    }>;
    clusterIP?: string;
    externalIPs?: string[];
    loadBalancerIP?: string;
    [key: string]: any;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{ ip?: string; hostname?: string }>;
    };
    [key: string]: any;
  };
}

/**
 * Kubernetes ConfigMap resource
 */
export interface ConfigMap extends ResourceBase {
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

/**
 * Kubernetes Secret resource
 */
export interface Secret extends ResourceBase {
  type?: string;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
  immutable?: boolean;
}

/**
 * Kubernetes Namespace resource
 */
export interface Namespace extends ResourceBase {
  spec?: {
    finalizers?: string[];
  };
  status?: {
    phase?: 'Active' | 'Terminating';
  };
}

/**
 * Kubernetes Node resource
 */
export interface Node extends ResourceBase {
  spec?: {
    podCIDR?: string;
    providerID?: string;
    taints?: Array<{
      key: string;
      value?: string;
      effect: string;
    }>;
    [key: string]: any;
  };
  status?: {
    capacity?: Record<string, string>;
    allocatable?: Record<string, string>;
    conditions?: Array<any>;
    addresses?: Array<{ type: string; address: string }>;
    nodeInfo?: {
      kubeletVersion?: string;
      osImage?: string;
      architecture?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

/**
 * Kubernetes Ingress resource
 */
export interface Ingress extends ResourceBase {
  spec?: {
    rules?: Array<{
      host?: string;
      http?: {
        paths: Array<{
          path?: string;
          pathType?: string;
          backend: {
            service?: {
              name: string;
              port: { number?: number; name?: string };
            };
          };
        }>;
      };
    }>;
    tls?: Array<{
      hosts?: string[];
      secretName?: string;
    }>;
    [key: string]: any;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{ ip?: string; hostname?: string }>;
    };
  };
}

/**
 * Rancher User resource
 */
export interface User extends ResourceBase {
  username?: string;
  principalIds?: string[];
  displayName?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * Rancher Cluster resource
 */
export interface Cluster extends ResourceBase {
  spec?: {
    displayName?: string;
    description?: string;
    rancherKubernetesEngineConfig?: any;
    defaultPodSecurityPolicyTemplateId?: string;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    driver?: string;
    provider?: string;
    version?: any;
    [key: string]: any;
  };
}

/**
 * Kubernetes PersistentVolumeClaim resource
 */
export interface PersistentVolumeClaim extends ResourceBase {
  spec?: {
    accessModes?: string[];
    storageClassName?: string;
    resources?: {
      requests?: Record<string, string>;
      limits?: Record<string, string>;
    };
    volumeName?: string;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    [key: string]: any;
  };
  status?: {
    phase?: string;
    accessModes?: string[];
    capacity?: Record<string, string>;
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes PersistentVolume resource
 */
export interface PersistentVolume extends ResourceBase {
  spec?: {
    capacity?: Record<string, string>;
    accessModes?: string[];
    persistentVolumeReclaimPolicy?: string;
    storageClassName?: string;
    volumeMode?: string;
    claimRef?: {
      name?: string;
      namespace?: string;
      uid?: string;
    };
    [key: string]: any;
  };
  status?: {
    phase?: string;
    message?: string;
    reason?: string;
    [key: string]: any;
  };
}

/**
 * Kubernetes ServiceAccount resource
 */
export interface ServiceAccount extends ResourceBase {
  secrets?: Array<{ name: string }>;
  imagePullSecrets?: Array<{ name: string }>;
  automountServiceAccountToken?: boolean;
}

/**
 * Kubernetes Endpoints resource
 */
export interface Endpoints extends ResourceBase {
  subsets?: Array<{
    addresses?: Array<{ ip: string; hostname?: string; nodeName?: string }>;
    notReadyAddresses?: Array<{ ip: string; hostname?: string; nodeName?: string }>;
    ports?: Array<{ name?: string; port: number; protocol?: string }>;
  }>;
}

/**
 * Kubernetes Event resource
 */
export interface Event extends ResourceBase {
  involvedObject?: {
    kind?: string;
    namespace?: string;
    name?: string;
    uid?: string;
    apiVersion?: string;
  };
  reason?: string;
  message?: string;
  source?: {
    component?: string;
    host?: string;
  };
  firstTimestamp?: string;
  lastTimestamp?: string;
  count?: number;
  type?: string;
}

/**
 * Kubernetes LimitRange resource
 */
export interface LimitRange extends ResourceBase {
  spec?: {
    limits?: Array<{
      type?: string;
      max?: Record<string, string>;
      min?: Record<string, string>;
      default?: Record<string, string>;
      defaultRequest?: Record<string, string>;
      maxLimitRequestRatio?: Record<string, string>;
    }>;
  };
}

/**
 * Kubernetes ResourceQuota resource
 */
export interface ResourceQuota extends ResourceBase {
  spec?: {
    hard?: Record<string, string>;
    scopes?: string[];
    scopeSelector?: {
      matchExpressions?: Array<any>;
    };
  };
  status?: {
    hard?: Record<string, string>;
    used?: Record<string, string>;
  };
}

/**
 * Kubernetes ReplicationController resource
 */
export interface ReplicationController extends ResourceBase {
  spec?: {
    replicas?: number;
    selector?: Record<string, string>;
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Pod['spec'];
    };
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    fullyLabeledReplicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    observedGeneration?: number;
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes StatefulSet resource
 */
export interface StatefulSet extends ResourceBase {
  spec?: {
    replicas?: number;
    serviceName?: string;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Pod['spec'];
    };
    volumeClaimTemplates?: Array<any>;
    updateStrategy?: {
      type?: string;
      rollingUpdate?: {
        partition?: number;
      };
    };
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    readyReplicas?: number;
    currentReplicas?: number;
    updatedReplicas?: number;
    currentRevision?: string;
    updateRevision?: string;
    observedGeneration?: number;
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes DaemonSet resource
 */
export interface DaemonSet extends ResourceBase {
  spec?: {
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Pod['spec'];
    };
    updateStrategy?: {
      type?: string;
      rollingUpdate?: {
        maxUnavailable?: number | string;
      };
    };
    [key: string]: any;
  };
  status?: {
    currentNumberScheduled?: number;
    numberMisscheduled?: number;
    desiredNumberScheduled?: number;
    numberReady?: number;
    updatedNumberScheduled?: number;
    numberAvailable?: number;
    numberUnavailable?: number;
    observedGeneration?: number;
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes ReplicaSet resource
 */
export interface ReplicaSet extends ResourceBase {
  spec?: {
    replicas?: number;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Pod['spec'];
    };
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    fullyLabeledReplicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    observedGeneration?: number;
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Kubernetes Job resource
 */
export interface Job extends ResourceBase {
  spec?: {
    parallelism?: number;
    completions?: number;
    activeDeadlineSeconds?: number;
    backoffLimit?: number;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Pod['spec'];
    };
    ttlSecondsAfterFinished?: number;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    startTime?: string;
    completionTime?: string;
    active?: number;
    succeeded?: number;
    failed?: number;
    [key: string]: any;
  };
}

/**
 * Kubernetes CronJob resource
 */
export interface CronJob extends ResourceBase {
  spec?: {
    schedule?: string;
    timezone?: string;
    startingDeadlineSeconds?: number;
    concurrencyPolicy?: string;
    suspend?: boolean;
    jobTemplate?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: Job['spec'];
    };
    successfulJobsHistoryLimit?: number;
    failedJobsHistoryLimit?: number;
    [key: string]: any;
  };
  status?: {
    active?: Array<any>;
    lastScheduleTime?: string;
    lastSuccessfulTime?: string;
    [key: string]: any;
  };
}

/**
 * Kubernetes IngressClass resource
 */
export interface IngressClass extends ResourceBase {
  spec?: {
    controller?: string;
    parameters?: {
      apiGroup?: string;
      kind?: string;
      name?: string;
      namespace?: string;
      scope?: string;
    };
  };
}

/**
 * Kubernetes NetworkPolicy resource
 */
export interface NetworkPolicy extends ResourceBase {
  spec?: {
    podSelector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    policyTypes?: string[];
    ingress?: Array<{
      from?: Array<any>;
      ports?: Array<{ protocol?: string; port?: number | string }>;
    }>;
    egress?: Array<{
      to?: Array<any>;
      ports?: Array<{ protocol?: string; port?: number | string }>;
    }>;
  };
}

/**
 * Kubernetes StorageClass resource
 */
export interface StorageClass extends ResourceBase {
  provisioner?: string;
  parameters?: Record<string, string>;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
  allowVolumeExpansion?: boolean;
  mountOptions?: string[];
  allowedTopologies?: Array<any>;
}

/**
 * Kubernetes CSIDriver resource
 */
export interface CSIDriver extends ResourceBase {
  spec?: {
    attachRequired?: boolean;
    podInfoOnMount?: boolean;
    volumeLifecycleModes?: string[];
    storageCapacity?: boolean;
    fsGroupPolicy?: string;
    tokenRequests?: Array<any>;
    requiresRepublish?: boolean;
  };
}

/**
 * Kubernetes CSINode resource
 */
export interface CSINode extends ResourceBase {
  spec?: {
    drivers?: Array<{
      name: string;
      nodeID: string;
      topologyKeys?: string[];
      allocatable?: {
        count?: number;
      };
    }>;
  };
}

/**
 * Kubernetes VolumeAttachment resource
 */
export interface VolumeAttachment extends ResourceBase {
  spec?: {
    attacher?: string;
    source?: {
      persistentVolumeName?: string;
      inlineVolumeSpec?: any;
    };
    nodeName?: string;
  };
  status?: {
    attached?: boolean;
    attachmentMetadata?: Record<string, string>;
    attachError?: {
      message?: string;
      time?: string;
    };
    detachError?: {
      message?: string;
      time?: string;
    };
  };
}

/**
 * Kubernetes Role resource
 */
export interface Role extends ResourceBase {
  rules?: Array<{
    apiGroups?: string[];
    resources?: string[];
    verbs?: string[];
    resourceNames?: string[];
  }>;
}

/**
 * Kubernetes RoleBinding resource
 */
export interface RoleBinding extends ResourceBase {
  subjects?: Array<{
    kind?: string;
    name?: string;
    namespace?: string;
    apiGroup?: string;
  }>;
  roleRef?: {
    apiGroup?: string;
    kind?: string;
    name?: string;
  };
}

/**
 * Kubernetes ClusterRole resource
 */
export interface ClusterRole extends ResourceBase {
  rules?: Array<{
    apiGroups?: string[];
    resources?: string[];
    verbs?: string[];
    resourceNames?: string[];
    nonResourceURLs?: string[];
  }>;
  aggregationRule?: {
    clusterRoleSelectors?: Array<{
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    }>;
  };
}

/**
 * Kubernetes ClusterRoleBinding resource
 */
export interface ClusterRoleBinding extends ResourceBase {
  subjects?: Array<{
    kind?: string;
    name?: string;
    namespace?: string;
    apiGroup?: string;
  }>;
  roleRef?: {
    apiGroup?: string;
    kind?: string;
    name?: string;
  };
}

/**
 * Kubernetes HorizontalPodAutoscaler resource
 */
export interface HorizontalPodAutoscaler extends ResourceBase {
  spec?: {
    scaleTargetRef?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
    };
    minReplicas?: number;
    maxReplicas?: number;
    targetCPUUtilizationPercentage?: number;
    metrics?: Array<any>;
    behavior?: {
      scaleUp?: any;
      scaleDown?: any;
    };
    [key: string]: any;
  };
  status?: {
    currentReplicas?: number;
    desiredReplicas?: number;
    currentMetrics?: Array<any>;
    conditions?: Array<any>;
    lastScaleTime?: string;
    [key: string]: any;
  };
}

/**
 * Kubernetes PriorityClass resource
 */
export interface PriorityClass extends ResourceBase {
  value?: number;
  globalDefault?: boolean;
  description?: string;
  preemptionPolicy?: string;
}

/**
 * Kubernetes PodDisruptionBudget resource
 */
export interface PodDisruptionBudget extends ResourceBase {
  spec?: {
    minAvailable?: number | string;
    maxUnavailable?: number | string;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
  };
  status?: {
    observedGeneration?: number;
    disruptedPods?: Record<string, string>;
    disruptionsAllowed?: number;
    currentHealthy?: number;
    desiredHealthy?: number;
    expectedPods?: number;
    conditions?: Array<any>;
  };
}

/**
 * Kubernetes RuntimeClass resource
 */
export interface RuntimeClass extends ResourceBase {
  handler?: string;
  overhead?: {
    podFixed?: Record<string, string>;
  };
  scheduling?: {
    nodeSelector?: Record<string, string>;
    tolerations?: Array<any>;
  };
}

/**
 * Kubernetes CertificateSigningRequest resource
 */
export interface CertificateSigningRequest extends ResourceBase {
  spec?: {
    request?: string;
    signerName?: string;
    expirationSeconds?: number;
    usages?: string[];
    username?: string;
    uid?: string;
    groups?: string[];
    extra?: Record<string, string[]>;
  };
  status?: {
    conditions?: Array<any>;
    certificate?: string;
  };
}

/**
 * Kubernetes Lease resource
 */
export interface Lease extends ResourceBase {
  spec?: {
    holderIdentity?: string;
    leaseDurationSeconds?: number;
    acquireTime?: string;
    renewTime?: string;
    leaseTransitions?: number;
  };
}

/**
 * Kubernetes ValidatingWebhookConfiguration resource
 */
export interface ValidatingWebhookConfiguration extends ResourceBase {
  webhooks?: Array<{
    name?: string;
    clientConfig?: {
      url?: string;
      service?: {
        namespace?: string;
        name?: string;
        path?: string;
        port?: number;
      };
      caBundle?: string;
    };
    rules?: Array<any>;
    failurePolicy?: string;
    matchPolicy?: string;
    namespaceSelector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    objectSelector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    sideEffects?: string;
    timeoutSeconds?: number;
    admissionReviewVersions?: string[];
  }>;
}

/**
 * Kubernetes MutatingWebhookConfiguration resource
 */
export interface MutatingWebhookConfiguration extends ResourceBase {
  webhooks?: Array<{
    name?: string;
    clientConfig?: {
      url?: string;
      service?: {
        namespace?: string;
        name?: string;
        path?: string;
        port?: number;
      };
      caBundle?: string;
    };
    rules?: Array<any>;
    failurePolicy?: string;
    matchPolicy?: string;
    namespaceSelector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    objectSelector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    reinvocationPolicy?: string;
    sideEffects?: string;
    timeoutSeconds?: number;
    admissionReviewVersions?: string[];
  }>;
}

/**
 * Rancher Project resource
 */
export interface Project extends ResourceBase {
  spec?: {
    displayName?: string;
    description?: string;
    clusterName?: string;
    resourceQuota?: {
      limit?: Record<string, string>;
    };
    namespaceDefaultResourceQuota?: {
      limit?: Record<string, string>;
    };
    containerDefaultResourceLimit?: {
      limitsCpu?: string;
      limitsMemory?: string;
      requestsCpu?: string;
      requestsMemory?: string;
    };
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    [key: string]: any;
  };
}

/**
 * Rancher RoleTemplate resource
 */
export interface RoleTemplate extends ResourceBase {
  administrative?: boolean;
  builtin?: boolean;
  clusterCreatorDefault?: boolean;
  context?: string;
  description?: string;
  displayName?: string;
  external?: boolean;
  hidden?: boolean;
  locked?: boolean;
  projectCreatorDefault?: boolean;
  roleTemplateIds?: string[];
  rules?: Array<{
    apiGroups?: string[];
    resources?: string[];
    verbs?: string[];
    [key: string]: any;
  }>;
}

/**
 * Rancher GlobalRole resource
 */
export interface GlobalRole extends ResourceBase {
  builtin?: boolean;
  description?: string;
  displayName?: string;
  newUserDefault?: boolean;
  rules?: Array<{
    apiGroups?: string[];
    resources?: string[];
    verbs?: string[];
    nonResourceURLs?: string[];
    [key: string]: any;
  }>;
  inheritedClusterRoles?: string[];
}

/**
 * Rancher GlobalRoleBinding resource
 */
export interface GlobalRoleBinding extends ResourceBase {
  globalRoleName?: string;
  userName?: string;
  groupPrincipalName?: string;
}

/**
 * Rancher AuthConfig resource
 */
export interface AuthConfig extends ResourceBase {
  enabled?: boolean;
  accessMode?: string;
  allowedPrincipalIds?: string[];
  [key: string]: any;
}

/**
 * Rancher Setting resource
 */
export interface Setting extends ResourceBase {
  value?: string;
  default?: string;
  customized?: boolean;
  source?: string;
}

/**
 * Rancher Token resource
 */
export interface Token extends ResourceBase {
  token?: string;
  userPrincipal?: {
    principalType?: string;
    me?: boolean;
    loginName?: string;
    displayName?: string;
    provider?: string;
    [key: string]: any;
  };
  authProvider?: string;
  ttl?: number;
  userId?: string;
  enabled?: boolean;
  expired?: boolean;
  isDerived?: boolean;
  lastUpdateTime?: string;
  description?: string;
  current?: boolean;
}

/**
 * Rancher NodeDriver resource
 */
export interface NodeDriver extends ResourceBase {
  active?: boolean;
  builtin?: boolean;
  checksum?: string;
  description?: string;
  displayName?: string;
  externalId?: string;
  uiUrl?: string;
  url?: string;
  whitelistDomains?: string[];
  [key: string]: any;
}

/**
 * Rancher KontainerDriver resource
 */
export interface KontainerDriver extends ResourceBase {
  active?: boolean;
  actualUrl?: string;
  builtin?: boolean;
  checksum?: string;
  displayName?: string;
  url?: string;
  uiUrl?: string;
  whitelistDomains?: string[];
  [key: string]: any;
}

/**
 * Rancher ClusterRoleTemplateBinding resource
 */
export interface ClusterRoleTemplateBinding extends ResourceBase {
  clusterName?: string;
  roleTemplateName?: string;
  userPrincipalName?: string;
  userName?: string;
  groupName?: string;
  groupPrincipalName?: string;
}

/**
 * Rancher ProjectRoleTemplateBinding resource
 */
export interface ProjectRoleTemplateBinding extends ResourceBase {
  projectName?: string;
  roleTemplateName?: string;
  userPrincipalName?: string;
  userName?: string;
  groupName?: string;
  groupPrincipalName?: string;
  serviceAccount?: string;
}

/**
 * Fleet Cluster resource
 */
export interface FleetCluster extends ResourceBase {
  spec?: {
    paused?: boolean;
    clientID?: string;
    kubeConfigSecret?: string;
    kubeConfigSecretNamespace?: string;
    redeployAgentGeneration?: number;
    agentEnvVars?: Array<{ name: string; value?: string }>;
    agentNamespace?: string;
    privateRepoURL?: string;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    agent?: {
      lastSeen?: string;
      namespace?: string;
      [key: string]: any;
    };
    agentDeployedGeneration?: number;
    agentMigrated?: boolean;
    agentNamespaceMigrated?: boolean;
    cattleNamespaceMigrated?: boolean;
    desiredReadyGitRepos?: number;
    display?: {
      readyBundles?: string;
      readyNodes?: string;
      sampleNode?: string;
      state?: string;
    };
    readyGitRepos?: number;
    [key: string]: any;
  };
}

/**
 * Fleet GitRepo resource
 */
export interface GitRepo extends ResourceBase {
  spec?: {
    repo?: string;
    branch?: string;
    revision?: string;
    clientSecretName?: string;
    caBundle?: string;
    insecureSkipTLSverify?: boolean;
    paths?: string[];
    paused?: boolean;
    serviceAccount?: string;
    targets?: Array<{
      name?: string;
      clusterSelector?: {
        matchLabels?: Record<string, string>;
        matchExpressions?: Array<any>;
      };
      clusterGroup?: string;
      clusterGroupSelector?: {
        matchLabels?: Record<string, string>;
        matchExpressions?: Array<any>;
      };
    }>;
    pollingInterval?: string;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    commit?: string;
    display?: {
      readyBundleDeployments?: string;
      state?: string;
    };
    gitJobStatus?: string;
    observedGeneration?: number;
    readyClusters?: number;
    desiredReadyClusters?: number;
    [key: string]: any;
  };
}

/**
 * Fleet Bundle resource
 */
export interface Bundle extends ResourceBase {
  spec?: {
    paused?: boolean;
    rolloutStrategy?: {
      maxUnavailable?: number | string;
      maxUnavailablePartitions?: number | string;
      autoPartitionSize?: number | string;
      partitions?: Array<any>;
    };
    resources?: Array<{
      content?: string;
      encoding?: string;
      name?: string;
    }>;
    targets?: Array<{
      name?: string;
      clusterSelector?: {
        matchLabels?: Record<string, string>;
        matchExpressions?: Array<any>;
      };
      clusterGroup?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    display?: {
      readyBundles?: string;
      state?: string;
    };
    maxNew?: number;
    maxUnavailable?: number;
    maxUnavailablePartitions?: number;
    newlyCreated?: number;
    observedGeneration?: number;
    ready?: number;
    unavailable?: number;
    unavailablePartitions?: number;
    waitingApproved?: number;
    [key: string]: any;
  };
}

/**
 * Fleet ClusterGroup resource
 */
export interface ClusterGroup extends ResourceBase {
  spec?: {
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
  };
  status?: {
    clusterCount?: number;
    nonReadyClusterCount?: number;
    nonReadyClusters?: string[];
    conditions?: Array<any>;
    display?: {
      readyClusters?: string;
      readyBundles?: string;
      state?: string;
    };
    [key: string]: any;
  };
}

/**
 * Fleet Workspace resource
 */
export interface FleetWorkspace extends ResourceBase {
  [key: string]: any;
}

/**
 * Catalog App resource
 */
export interface App extends ResourceBase {
  spec?: {
    chart?: {
      metadata?: {
        name?: string;
        version?: string;
        annotations?: Record<string, string>;
      };
      values?: Record<string, any>;
    };
    name?: string;
    version?: string;
    namespace?: string;
    projectID?: string;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    summary?: {
      state?: string;
      error?: boolean;
      transitioning?: boolean;
      message?: string[];
    };
    [key: string]: any;
  };
}

/**
 * Catalog ClusterRepo resource
 */
export interface ClusterRepo extends ResourceBase {
  spec?: {
    url?: string;
    gitRepo?: string;
    gitBranch?: string;
    clientSecret?: {
      name?: string;
      namespace?: string;
    };
    caBundle?: string;
    insecureSkipTLSverify?: boolean;
    serviceAccount?: string;
    serviceAccountNamespace?: string;
    disableSameOriginCheck?: boolean;
    exponentialBackOffMaxRetries?: number;
    exponentialBackOffMinInterval?: number;
    exponentialBackOffMaxInterval?: number;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    indexConfigMapName?: string;
    indexConfigMapNamespace?: string;
    indexConfigMapResourceVersion?: string;
    observedGeneration?: number;
    url?: string;
    branch?: string;
    commit?: string;
    downloadTime?: string;
    numberOfErrors?: number;
    [key: string]: any;
  };
}

/**
 * Rancher Provisioning Cluster resource (provisioning.cattle.io)
 */
export interface ProvisioningCluster extends ResourceBase {
  spec?: {
    cloudCredentialSecretName?: string;
    kubernetesVersion?: string;
    localClusterAuthEndpoint?: {
      enabled?: boolean;
      caCerts?: string;
      fqdn?: string;
    };
    rkeConfig?: {
      chartValues?: Record<string, any>;
      machineGlobalConfig?: Record<string, any>;
      machinePools?: Array<{
        name?: string;
        quantity?: number;
        etcdRole?: boolean;
        controlPlaneRole?: boolean;
        workerRole?: boolean;
        machineConfigRef?: {
          kind?: string;
          name?: string;
        };
        [key: string]: any;
      }>;
      machineSelectorConfig?: Array<any>;
      registries?: any;
      upgradeStrategy?: {
        controlPlaneConcurrency?: string;
        controlPlaneDrainOptions?: any;
        workerConcurrency?: string;
        workerDrainOptions?: any;
      };
      etcd?: any;
      [key: string]: any;
    };
    [key: string]: any;
  };
  status?: {
    agentDeployed?: boolean;
    clusterName?: string;
    clientSecretName?: string;
    conditions?: Array<any>;
    observedGeneration?: number;
    ready?: boolean;
    [key: string]: any;
  };
}

/**
 * Cluster API (CAPI) Cluster resource
 */
export interface CapiCluster extends ResourceBase {
  spec?: {
    clusterNetwork?: {
      pods?: {
        cidrBlocks?: string[];
      };
      services?: {
        cidrBlocks?: string[];
      };
      serviceDomain?: string;
    };
    controlPlaneRef?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      namespace?: string;
    };
    infrastructureRef?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      namespace?: string;
    };
    paused?: boolean;
    topology?: any;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    controlPlaneReady?: boolean;
    infrastructureReady?: boolean;
    phase?: string;
    observedGeneration?: number;
    [key: string]: any;
  };
}

/**
 * Cluster API Machine Deployment resource
 */
export interface MachineDeployment extends ResourceBase {
  spec?: {
    clusterName?: string;
    replicas?: number;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<any>;
    };
    strategy?: {
      type?: string;
      rollingUpdate?: {
        maxSurge?: number | string;
        maxUnavailable?: number | string;
      };
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec?: {
        bootstrap?: {
          configRef?: {
            apiVersion?: string;
            kind?: string;
            name?: string;
          };
        };
        clusterName?: string;
        infrastructureRef?: {
          apiVersion?: string;
          kind?: string;
          name?: string;
        };
        version?: string;
        [key: string]: any;
      };
    };
    minReadySeconds?: number;
    progressDeadlineSeconds?: number;
    revisionHistoryLimit?: number;
    paused?: boolean;
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    readyReplicas?: number;
    updatedReplicas?: number;
    unavailableReplicas?: number;
    availableReplicas?: number;
    conditions?: Array<any>;
    observedGeneration?: number;
    phase?: string;
    [key: string]: any;
  };
}

/**
 * Cluster API Machine resource
 */
export interface Machine extends ResourceBase {
  spec?: {
    clusterName?: string;
    bootstrap?: {
      configRef?: {
        apiVersion?: string;
        kind?: string;
        name?: string;
        namespace?: string;
      };
      dataSecretName?: string;
    };
    infrastructureRef?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      namespace?: string;
    };
    providerID?: string;
    version?: string;
    failureDomain?: string;
    nodeDrainTimeout?: string;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<any>;
    phase?: string;
    nodeRef?: {
      kind?: string;
      name?: string;
      uid?: string;
    };
    bootstrapReady?: boolean;
    infrastructureReady?: boolean;
    nodeInfo?: {
      architecture?: string;
      kubeletVersion?: string;
      [key: string]: any;
    };
    observedGeneration?: number;
    [key: string]: any;
  };
}
