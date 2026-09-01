// original aks default attributes are declared in @/pkg/eks/components/CruAKS.vue. This file is a typescript file to be consumed by cypress. Any changes in the default values must also be updated here.

export const DEFAULT_REGION = 'eastus';

export const defaultNodePool = {
  availabilityZones:     'zone 1zone 2zone 3',
  count:                 '1',
  enableAutoScaling:     false,
  maxPods:               '110',
  maxSurge:              '1',
  mode:                  'System',
  name:                  'agentpool',
  nodeLabels:            { },
  nodeTaints:            [],
  orchestratorVersion:   '',
  osDiskSizeGB:          '128',
  osDiskType:            'Managed',
  osType:                'Linux',
  vmSize:                'Standard_D2d_v4',
  _isNewOrUnprovisioned: true,
  _validation:           {}
};

export const importedDefaultAksConfig = {
  clusterName:      '',
  imported:         true,
  resourceGroup:    '',
  resourceLocation: DEFAULT_REGION,
};

export const defaultAksConfig = {
  clusterName:        '',
  imported:           false,
  linuxAdminUsername: 'azureuser',
  loadBalancerSku:    'Standard',
  networkPlugin:      'Kubenet',
  privateCluster:     false,
  tags:               {},
  outboundType:       'Loadbalancer',
  serviceCidr:        '10.0.0.0/16',
  dockerBridgeCidr:   '172.17.0.1/16',
  dnsServiceIp:       '10.0.0.10',
};

export const defaultCluster = {
  dockerRootDir:           '/var/lib/docker',
  enableClusterAlerting:   false,
  enableClusterMonitoring: false,
  enableNetworkPolicy:     false,
  labels:                  {},
  annotations:             {},
  windowsPreferedCluster:  false,
};

export const NETWORKING_AUTH_MODES = {
  MANAGED_IDENTITY:  'managedIdentity',
  SERVICE_PRINCIPAL: 'servicePrincipal' // this is an arbitrary value that UI uses only to show a radio group, it won't be sent along with the config object
};
