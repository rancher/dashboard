import { GKEMachineType, GKENetwork, GKESubnetwork } from 'types/gcp';

export interface GKENodePool {
  autoscaling: {
    enabled?: boolean,
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
    serviceAccount?: string | null,
    oauthScopes?: string[],
    preemptible?: boolean,
    taints?: any,
    tags?: any
  },
  initialNodeCount?: number,
  management: {
    autoRepair?: boolean,
    autoUpgrade?: boolean
  },
  maxPodsConstraint?: number,
  name: string,
  version?: string,
  _isNewOrUnprovisioned?: boolean
  _id?: string
  _minMaxValid?: boolean
  _nameUnique?: boolean
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
  masterAuthorizedNetworks: { enabled: boolean, cidrBlocks?: string[] },
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

export interface GKEMachineTypeOption extends GKEMachineType {
  label: string,
  kind?:string,
  value?:string,
  disabled?:boolean,
}

export interface GKENetworkOption extends Partial<GKENetwork>{
  label: string,
  kind?: string,
  disabled?: boolean,
}

export interface GKESubnetworkOption extends Partial<GKESubnetwork>{
  label: string,
}

export interface GKESecondaryRangeOption {
  label: string,
  rangeName: string,
  ipCidrRange?: string
}
