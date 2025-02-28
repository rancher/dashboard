export type AKSPoolMode = 'System' | 'User'

export type AKSDiskType = 'Managed' | 'Ephemeral'

export type LoadBalancerSku = 'Standard' | 'Basic'

export type OutboundType = 'LoadBalancer' | 'UserDefinedRouting'

export interface AKSNodePool {
  availabilityZones?: string[],
  count?: number,
  enableAutoScaling?: boolean,
  maxPods?: number,
  maxSurge?: string,
  minCount?: number,
  maxCount?: number,
  mode?: AKSPoolMode,
  name?: string,
  nodeLabels?: Object,
  nodeTaints?: string[],
  orchestratorVersion?: string,
  osDiskSizeGB?: number,
  osDiskType?: AKSDiskType,
  osType?: string,
  type?: string,
  vmSize?: string,
  _isNewOrUnprovisioned?: boolean,
  _id?: string
  _validation: {
    _validName?: boolean
    _validSize?: boolean
    _validAZ?: boolean
    _validCount?: boolean
    _validMinMax?: boolean
    _validMin?: boolean
    _validMax?: boolean
    _validTaints?: boolean
  }
}

export interface AKSConfig {
  authBaseUrl?: string,
  authorizedIpRanges?: string[],
  azureCredentialSecret?: string,
  baseUrl?: string,
  clusterName?: string,
  dnsPrefix?: string,
  dnsServiceIp?: string,
  dockerBridgeCidr?: string,
  httpApplicationRouting?: boolean,
  imported?: boolean,
  kubernetesVersion?: string,
  linuxAdminUsername?: string,
  loadBalancerSku?: LoadBalancerSku,
  logAnalyticsWorkspaceGroup?: string,
  logAnalyticsWorkspaceName?: string,
  managedIdentity?:string,
  monitoring?: boolean,
  networkPlugin?: string,
  networkPolicy?: string,
  nodePools?: AKSNodePool[],
  nodeResourceGroup?: string,
  outboundType?: OutboundType,
  podCidr?: string,
  privateCluster?: boolean,
  resourceGroup?: string,
  resourceLocation?: string
  serviceCidr?: string
  sshPublicKey?: string
  subnet?: string,
  tags?: Map<string, string>,
  virtualNetwork?: string,
  virtualNetworkResourceGroup?: string
}

export interface VirtualNetworkSubnet {
  name: string,
  addressRange: string
}
export interface AKSVirtualNetwork {
  location: string,
  name: string,
  resourceGroup: string,
  subnets: VirtualNetworkSubnet[]
}
