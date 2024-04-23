export type AKSPoolMode = 'System' | 'User'

export type AKSDiskType = 'Managed' | 'Ephemeral'

export type LoadBalancerSku = 'Standard' | 'Basic'

export type OutboundType = 'LoadBalancer' | 'UserDefinedRouting'

export interface AKSNodePool {
  availabilityZones?: String[],
  count?: Number,
  enableAutoScaling?: Boolean,
  maxPods?: Number,
  maxSurge?: String,
  minCount?: Number,
  maxCount?: Number,
  mode?: AKSPoolMode,
  name?: String,
  nodeLabels?: Object,
  nodeTaints?: String[],
  orchestratorVersion?: String,
  osDiskSizeGB?: Number,
  osDiskType?: AKSDiskType,
  osType?: String,
  type?: String,
  vmSize?: String,
  _isNewOrUnprovisioned?: Boolean,
  _id?: String
  _validSize?: Boolean
  _validAZ?: Boolean
}

export interface AKSConfig {
  authBaseUrl?: String,
  authorizedIpRanges?: String[],
  azureCredentialSecret?: String,
  baseUrl?: String,
  clusterName?: String,
  dnsPrefix?: String,
  dnsServiceIp?: String,
  dockerBridgeCidr?: String,
  httpApplicationRouting?: Boolean,
  imported?: Boolean,
  kubernetesVersion?: String,
  linuxAdminUsername?: String,
  loadBalancerSku?: LoadBalancerSku,
  logAnalyticsWorkspaceGroup?: String,
  logAnalyticsWorkspaceName?: String,
  monitoring?: Boolean,
  networkPlugin?: String,
  networkPolicy?: String,
  nodePools?: AKSNodePool[],
  nodeResourceGroup?: String,
  outboundType?: OutboundType,
  podCidr?: String,
  privateCluster?: Boolean,
  resourceGroup?: String,
  resourceLocation?: String
  serviceCidr?: String
  sshPublicKey?: String
  subnet?: String,
  tags?: Map<string, string>,
  virtualNetwork?: String,
  virtualNetworkResourceGroup?: String
}

export interface VirtualNetworkSubnet {
  name: String,
  addressRange: String
}
export interface AKSVirtualNetwork {
  location: String,
  name: String,
  resourceGroup: String,
  subnets: VirtualNetworkSubnet[]
}
