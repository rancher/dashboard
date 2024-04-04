export interface GKENodePool {
  autoscaling?: {
    enabled: boolean,
    maxNodeCount?: number,
    minNodeCount?: number
  },
  config: {
    diskSizeGb?: number,
    diskType?: string,
    imageType?: string,
    labels?: any,
    localSsdCount?: number,
    machineType?: string,
    oauthScopes?: string[],
    preemptible?: boolean,
    taints?: any,
    tags?: any
  },
  initialNodeCount?: number,
  management?: {
    autoRepair?: boolean,
    autoUpgrade?: boolean
  },
  maxPodsConstraint?: number,
  name: string,
  _isNewOrUnprovisioned?: boolean
  version?: string,
  _id?: string
}

export interface GKEConfig {
  imported: boolean,
  clusterAddons: {
    horizontalPodAutoscaling: boolean,
    httpLoadBalancing: boolean,
    networkPolicyConfig: boolean
  },
  clusterIpv4Cidr: string,
  clusterName: string,
  description: string,
  enableKubernetesAlpha: boolean,
  googleCredentialSecret: string,
  ipAllocationPolicy: {
    clusterIpv4CidrBlock: string,
    clusterSecondaryRangeName?: any,
    createSubnetwork: boolean,
    nodeIpv4CidrBlock?: any,
    servicesIpv4CidrBlock: string,
    servicesSecondaryRangeName?: any,
    subnetworkName?: any,
    useIpAliases: boolean,
    clusterIpv4Cidr: string
  },
  kubernetesVersion: string,
  labels: any,
  locations: any[],
  loggingService: string,
  maintenanceWindow: string,
  masterAuthorizedNetworks: { enabled: boolean },
  monitoringService: string,
  network: string,
  networkPolicyEnabled: boolean,
  nodePools: GKENodePool[],
  privateClusterConfig: {
    enablePrivateEndpoint: boolean,
    enablePrivateNodes: boolean,
    masterIpv4CidrBlock?: any
  },
  projectID: string,
  region: string,
  subnetwork: string,
  zone: string
}
