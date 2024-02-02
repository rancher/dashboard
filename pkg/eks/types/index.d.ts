export interface EKSLaunchTemplate {
  id?: string,
  name?: string,
  version?: number
}

export interface EKSNodeGroup {
  desiredSize?: number,
  diskSize?: number,
  ec2SshKey?: number,
  gpu?: boolean,
  imageId?: string,
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
}

export interface EKSConfig {
  amazonCredentialSecret: string,
  displayName?: string,
  ebsCSIDriver?: boolean,
  imported: boolean,
  kmsKey?: string,
  kubernetesVersion?: string,
  loggingTypes?: string[],
  nodeGroups?: EKSNodeGroup[]
  privateAccess?: boolean,
  publicAcces?: boolean,
  publicAccessSources?: string[],
  region?: string,
  secretsEncryption?: boolean,
  securityGroups?: string[],
  serviceRole?: string,
  subnets?: string[],
  tags?: string[]
}
