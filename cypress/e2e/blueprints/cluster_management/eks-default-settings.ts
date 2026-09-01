// original eks default attributes are declared in @/pkg/eks/components/CruEKS.vue. This file is a typescript file to be consumed by cypress. Any changes in the default values must also be updated here.
export const DEFAULT_CLUSTER = {
  dockerRootDir:                       '/var/lib/docker',
  enableClusterAlerting:               false,
  enableClusterMonitoring:             false,
  enableNetworkPolicy:                 false,
  labels:                              {},
  annotations:                         {},
  windowsPreferedCluster:              false,
  fleetAgentDeploymentCustomization:   {},
  clusterAgentDeploymentCustomization: {}
};

export const DEFAULT__IMPORT_CLUSTER = {
  dockerRootDir:                       '/var/lib/docker',
  enableNetworkPolicy:                 false,
  labels:                              {},
  annotations:                         {},
  windowsPreferedCluster:              false,
  fleetAgentDeploymentCustomization:   {},
  clusterAgentDeploymentCustomization: {},
  eksConfig:                           {
    amazonCredentialSecret: '',
    displayName:            '',
    imported:               true,
    region:                 ''
  }
};

export const DEFAULT_REGION = 'us-west-2';

export const DEFAULT_NODE_GROUP_CONFIG = {
  desiredSize:          '2',
  diskSize:             '20',
  ec2SshKey:            '',
  gpu:                  false,
  imageId:              null,
  instanceType:         't3.medium',
  labels:               {},
  maxSize:              '2',
  minSize:              '2',
  nodegroupName:        'group1',
  nodeRole:             'Default (One will be created automatically)',
  requestSpotInstances: false,
  resourceTags:         {},
  spotInstanceTypes:    [],
  subnets:              [],
  tags:                 {},
  type:                 'nodeGroup',
  userData:             '',
  _isNew:               true,
};

export const DEFAULT_EKS_CONFIG = {
  publicAccess:        true,
  privateAccess:       false,
  publicAccessSources: [],
  secretsEncryption:   false,
  securityGroups:      [],
  tags:                {},
  subnets:             [],
  loggingTypes:        [],
};
