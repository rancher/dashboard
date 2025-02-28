import NormanModel from '@shell/plugins/steve/norman-class';

export * as AWS from './aws-sdk';

export interface EKSLaunchTemplate {
  id?: string,
  name?: string,
  version?: number
}

export interface EKSNodeGroup {
  desiredSize?: number,
  diskSize?: number,
  ec2SshKey?: string,
  gpu?: boolean,
  imageId?: string | null,
  instanceType?: string,
  labels?: {
    [key: string]: string
  },
  launchTemplate?: EKSLaunchTemplate,
  maxSize?: number,
  minSize?: number,
  nodeRole?: string,
  nodegroupName?: string,
  requestSpotInstances?: boolean,
  resourceTags?: {
    [key: string]: string
  },
  spotInstanceTypes?: string[],
  subnets?: string[],
  tags?: {
    [key: string]: string
  },
  userData?: string,
  version?: string
  __nameUnique?: boolean
  _isNew?: boolean,
  _isUpgrading?: boolean
}

export interface EKSConfig {
  amazonCredentialSecret: string,
  displayName?: string,
  ebsCSIDriver?: boolean,
  imported: boolean,
  kmsKey?: string,
  kubernetesVersion?: string,
  loggingTypes?: string[],
  nodeGroups?: EKSNodeGroup[] | null,
  privateAccess?: boolean,
  publicAccess?: boolean,
  publicAccessSources?: string[],
  region?: string,
  secretsEncryption?: boolean,
  securityGroups?: string[],
  serviceRole?: string,
  subnets?: string[],
  tags?: string[]
  enableNetworkPolicy?: boolean
}

export interface NormanCluster extends NormanModel {
  description?: string,
  eksConfig?: EKSConfig,
  name?: string,
  fleetAgentDeploymentCustomization?: any,
  clusterAgentDeploymentCustomization?: any,
  id?: string,
  enableNetworkPolicy?: boolean,
  status? : {[key:string]: any},
  eksStatus?: {[key:string]:any},
  waitForCondition(name: any, withStatus?: string | undefined, timeoutMs?: number | undefined, intervalMs?: number | undefined): Promise<void>
}
