import { Store } from 'vuex';

const MOCK_ZONE = 'us-central1-c';

const mockedGKEZonesResponse = {
  id:    'projects/test-project/zones',
  items: [{
    availableCpuPlatforms: ['Intel Broadwell', 'Intel Cascade Lake', 'Intel Emerald Rapids', 'AMD Genoa', 'Intel Haswell'],
    creationTimestamp:     '1969-12-31T16:00:00.000-08:00',
    description:           'us-east1-b',
    id:                    '2231',
    kind:                  'compute#zone',
    name:                  'us-east1-b',
    region:                'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east1',
    selfLink:              'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-east1-b',
    status:                'UP'
  },
  {
    availableCpuPlatforms: ['Intel Broadwell', 'Intel Cascade Lake', 'Intel Emerald Rapids', 'AMD Genoa', 'Intel Haswell'],
    creationTimestamp:     '1969-12-31T16:00:00.000-08:00',
    description:           'us-east1-c',
    id:                    '2233',
    kind:                  'compute#zone',
    name:                  'us-east1-c',
    region:                'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east1',
    selfLink:              'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-east1-c',
    status:                'UP'
  },
  {
    availableCpuPlatforms: ['Intel Broadwell', 'Intel Cascade Lake', 'Intel Emerald Rapids', 'AMD Genoa', 'Intel Haswell'],
    creationTimestamp:     '1969-12-31T16:00:00.000-08:00',
    description:           'us-east1-f',
    id:                    '2233',
    kind:                  'compute#zone',
    name:                  'us-east1-f',
    region:                'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east1',
    selfLink:              'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-east1-f',
    status:                'UP'
  },
  {
    availableCpuPlatforms: ['Intel Broadwell', 'Intel Cascade Lake', 'Intel Emerald Rapids', 'AMD Genoa', 'Intel Haswell'],
    creationTimestamp:     '1969-12-31T16:00:00.000-08:00',
    description:           'us-east4-c',
    id:                    '2272',
    kind:                  'compute#zone',
    name:                  'us-east4-c',
    region:                'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east4',
    selfLink:              'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-east4-c',
    status:                'UP',
    supportsPzs:           true,
  },
  {
    availableCpuPlatforms: ['Intel Broadwell', 'Intel Cascade Lake', 'Intel Emerald Rapids', 'AMD Genoa', 'Intel Haswell'],
    creationTimestamp:     '1969-12-31T16:00:00.000-08:00',
    description:           'us-east4-b',
    id:                    '2271',
    kind:                  'compute#zone',
    name:                  'us-east4-b',
    region:                'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east4',
    selfLink:              'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-east4-b',
    status:                'UP',
    supportsPzs:           true,
  }],
  kind:     'compute#zoneList',
  selfLink: 'https://www.googleapis.com/compute/v1/projects/test-project/zones',
};

const mockedGKEVersionsResponse = {
  channels: [
    {
      channel:        'RAPID',
      defaultVersion: '1.29.3-gke.1282001',
      validVersions:  [
        '1.30.0-gke.1457000',
        '1.30.0-gke.1167000',
        '1.29.4-gke.1447000',
        '1.29.4-gke.1043000',
        '1.29.3-gke.1282001',
        '1.28.9-gke.1209000',
        '1.28.9-gke.1000000',
        '1.27.13-gke.1166000',
        '1.27.13-gke.1000000',
        '1.26.15-gke.1300000',
        '1.26.15-gke.1191000']
    }
  ],
  defaultClusterVersion: '1.28.7-gke.1026000',
  defaultImageType:      'COS_CONTAINERD',
  validImageTypes:       ['COS_CONTAINERD',
    'COS',
    'UBUNTU',
    'UBUNTU_CONTAINERD',
    'WINDOWS_LTSC',
    'WINDOWS_LTSC_CONTAINERD',
    'WINDOWS_SAC',
    'WINDOWS_SAC_CONTAINERD'],
  validMasterVersions: [
    '1.29.4-gke.1447000',
    '1.29.4-gke.1043000',
    '1.29.3-gke.1282001',
    '1.29.3-gke.1282000',
    '1.29.1-gke.1589020',
    '1.29.1-gke.1589018',
    '1.28.9-gke.1209000',
    '1.28.9-gke.1000000',
    '1.28.8-gke.1095000',
    '1.28.7-gke.1026001',
    '1.28.7-gke.1026000',
    '1.27.13-gke.1166000',
    '1.27.13-gke.1000000',
    '1.27.12-gke.1115000',
    '1.27.11-gke.1062003',
    '1.27.11-gke.1062001',
    '1.27.11-gke.1062000',
    '1.27.8-gke.1067004',
    '1.26.15-gke.1300000',
    '1.26.15-gke.1191000',
    '1.26.15-gke.1090000',
    '1.26.14-gke.1044001',
    '1.26.14-gke.1044000',
    '1.26.8-gke.200'],
  validNodeVersions: ['1.29.4-gke.1447000',
    '1.29.4-gke.1043000',
    '1.29.3-gke.1282001',
    '1.29.3-gke.1282000',
    '1.29.1-gke.1589020',
    '1.29.1-gke.1589018',
    '1.28.9-gke.1209000',
    '1.28.9-gke.1000000',
    '1.28.8-gke.1095000',
    '1.28.7-gke.1026001',
    '1.28.7-gke.1026000',
    '1.27.13-gke.1166000',
    '1.27.13-gke.1000000',
    '1.27.12-gke.1115000',
    '1.27.11-gke.1062003',
    '1.27.11-gke.1062001',
    '1.27.11-gke.1062000',
    '1.27.8-gke.1067004',
    '1.26.15-gke.1300000',
    '1.26.15-gke.1191000',
    '1.26.15-gke.1090000',
    '1.26.14-gke.1044001',
    '1.26.14-gke.1044000',
    '1.26.8-gke.200'],
};

const mockedGKEMachinesResponse = {
  id:
  'projects/test-project/zones/us-central1-c/machineTypes',
  items: [
    {
      creationTimestamp:            '1969-12-31T16:00:00.000-08:00',
      description:                  'Accelerator Optimized: 1 NVIDIA Tesla A100 GPU, 12 vCPUs, 85GB RAM',
      guestCpus:                    12,
      id:                           '1000012',
      kind:                         'compute#machineType',
      maximumPersistentDisks:       128,
      maximumPersistentDisksSizeGb: '263168',
      memoryMb:                     87040,
      name:                         'a2-highgpu-1g',
      selfLink:                     'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-central1-c/machineTypes/a2-highgpu-1g',
      zone:                         MOCK_ZONE,
    },
    {
      creationTimestamp:            '1969-12-31T16:00:00.000-08:00',
      description:                  'Accelerator Optimized: 8 NVIDIA Tesla A100 GPUs, 96 vCPUs, 680GB RAM',
      guestCpus:                    96,
      id:                           '1000096',
      kind:                         'compute#machineType',
      maximumPersistentDisks:       128,
      maximumPersistentDisksSizeGb: '524288',
      memoryMb:                     696320,
      name:                         'a2-highgpu-8g',
      selfLink:                     'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-central1-c/machineTypes/a2-highgpu-8g',
      zone:                         MOCK_ZONE
    },
    {
      creationTimestamp:            '1969-12-31T16:00:00.000-08:00',
      description:                  'Compute Optimized: 60 vCPUs, 240 GB RAM',
      guestCpus:                    60,
      id:                           '801060',
      kind:                         'compute#machineType',
      maximumPersistentDisks:       128,
      maximumPersistentDisksSizeGb: '524288',
      memoryMb:                     245760,
      name:                         'c2-standard-60',
      selfLink:                     'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-central1-c/machineTypes/c2-standard-60',
      zone:                         MOCK_ZONE,
    }
  ],
  kind:     'compute#machineTypeList',
  selfLink: 'https://www.googleapis.com/compute/v1/projects/test-project/zones/us-central1-c/machineTypes'
};

const mockedGKENetworksResponse = {
  items: [{
    autoCreateSubnetworks:                 true,
    creationTimestamp:                     '2022-10-26T14:50:30.702-07:00',
    id:                                    '1891026777371055433',
    kind:                                  'compute#network',
    mtu:                                   1460,
    name:                                  'test-network',
    networkFirewallPolicyEnforcementOrder: 'AFTER_CLASSIC_FIREWALL',
    routingConfig:                         { routingMode: 'REGIONAL' },
    routingMode:                           'REGIONAL',
    selfLink:                              'https://www.googleapis.com/compute/v1/projects/test-project/global/networks/test-network',
    selfLinkWithId:                        'https://www.googleapis.com/compute/v1/projects/test-project/global/networks/1891026777371055433',
    subnetworks:                           ['https://www.googleapis.com/compute/v1/projects/test-project/regions/africa-south1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-west8/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-northeast3/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-northeast2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-south2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west3/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-west3/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-west2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-northeast1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west12/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-southeast1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-south1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/southamerica-west1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-southeast2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/me-west1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east7/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-central1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/southamerica-east1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west9/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-north1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east4/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-east1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west10/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-central1/subnetworks/nwm-subnet',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-central2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-south1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east5/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-east1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west4/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west8/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/northamerica-northeast1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/australia-southeast2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-west4/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west6/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/northamerica-northeast2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-southwest1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-west1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/australia-southeast1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/europe-west1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/me-central1/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/asia-east2/subnetworks/test-network',
      'https://www.googleapis.com/compute/v1/projects/test-project/regions/me-central2/subnetworks/test-network']
  },
  {
    autoCreateSubnetworks:                 true,
    creationTimestamp:                     '2022-10-26T14:50:30.702-07:00',
    id:                                    '11111111',
    kind:                                  'compute#network',
    mtu:                                   1460,
    name:                                  'default',
    networkFirewallPolicyEnforcementOrder: 'AFTER_CLASSIC_FIREWALL',
    routingConfig:                         { routingMode: 'REGIONAL' },
    selfLink:                              'https://www.googleapis.com/compute/v1/projects/test-data-project/global/networks/default',
    selfLinkWithId:                        'https://www.googleapis.com/compute/v1/projects/test-data-project/global/networks/11111111',
    subnetworks:                           [
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/africa-south1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-west8/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-northeast3/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-northeast2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-south2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west3/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-west3/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-west2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-northeast1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west12/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-southeast1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-south1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/southamerica-west1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-southeast2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/me-west1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-east7/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-central1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/southamerica-east1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west9/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-north1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-east4/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-east1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west10/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-central2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-north2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-south1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/northamerica-south1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-east5/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-east1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west4/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west8/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/northamerica-northeast1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/australia-southeast2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-west4/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west6/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/northamerica-northeast2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-southwest1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-west1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/australia-southeast1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/europe-west1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/me-central1/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/asia-east2/subnetworks/default',
      'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/me-central2/subnetworks/default'
    ]
  }]
};

const mockedGKESubnetworksResponse = {
  items: [{
    creationTimestamp:       '2022-10-26T14:50:38.688-07:00',
    fingerprint:             '7PgCqrLW2yM=',
    gatewayAddress:          '10.128.0.1',
    id:                      '1435740182202815809',
    ipCidrRange:             '10.128.0.0/20',
    kind:                    'compute#subnetwork',
    name:                    'test-network-subnet',
    network:                 'https://www.googleapis.com/compute/v1/projects/test-project/global/networks/test-network',
    privateIpGoogleAccess:   true,
    privateIpv6GoogleAccess: 'DISABLE_GOOGLE_ACCESS',
    purpose:                 'PRIVATE',
    region:                  'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-central1',
    secondaryIpRanges:       [{ ipCidrRange: '10.0.1.0/24', rangeName: 'range-1' }],
    selfLink:                'https://www.googleapis.com/compute/v1/projects/test-project/regions/us-central1/subnetworks/test-network',
    stackType:               'IPV4_ONLY',
  },
  {
    creationTimestamp:       '2022-10-26T14:50:38.688-07:00',
    fingerprint:             '3456',
    gatewayAddress:          '10.128.0.1',
    id:                      '1234',
    ipCidrRange:             '10.128.0.0/20',
    kind:                    'compute#subnetwork',
    name:                    'default',
    network:                 'https://www.googleapis.com/compute/v1/projects/test-data-project/global/networks/default',
    privateIpGoogleAccess:   true,
    privateIpv6GoogleAccess: 'DISABLE_GOOGLE_ACCESS',
    purpose:                 'PRIVATE',
    region:                  'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-central1',
    secondaryIpRanges:       [
      {
        ipCidrRange: '10.0.1.0/24',
        rangeName:   'range-1'
      }
    ],
    selfLink:  'https://www.googleapis.com/compute/v1/projects/test-data-project/regions/us-central1/subnetworks/default',
    stackType: 'IPV4_ONLY'
  },
  ]
};

const mockedGKESharedSubnetworksResponse = {
  id:          '1234',
  kind:        'faked',
  selfLink:    'abc',
  subnetworks: [
    {
      ipCidrRange: '10.3.0.0/24',
      network:     'projects/host-project-309915/global/networks/host-shared-vpc',
      subnetwork:  'projects/host-project-309915/regions/us-west1/subnetworks/host-shared-vpc-us-west1-subnet-public'
    },
    {
      ipCidrRange: '10.4.0.0/24',
      network:     'projects/host-project-309915/global/networks/host-shared-vpc',
      subnetwork:  'projects/host-project-309915/regions/us-west1/subnetworks/host-shared-vpc-us-west1-subnet-private'
    },
    {
      ipCidrRange:       '10.2.0.0/24',
      network:           'projects/host-project-309915/global/networks/host-shared-vpc',
      secondaryIpRanges: [
        {
          ipCidrRange: '10.7.0.0/21',
          rangeName:   'pods',
          status:      'UNUSED'
        },
        {
          ipCidrRange: '10.8.0.0/21',
          rangeName:   'services',
          status:      'UNUSED'
        }
      ],
      subnetwork: 'projects/host-project-309915/regions/us-east1/subnetworks/host-shared-vpc-us-east1-subnet-private'
    },
    {
      ipCidrRange:       '10.1.0.0/24',
      network:           'projects/host-project-309915/global/networks/host-shared-vpc',
      secondaryIpRanges: [
        {
          ipCidrRange: '10.5.0.0/21',
          rangeName:   'pods',
          status:      'UNUSED'
        },
        {
          ipCidrRange: '10.6.0.0/21',
          rangeName:   'services',
          status:      'UNUSED'
        }
      ],
      subnetwork: 'projects/host-project-309915/regions/us-east1/subnetworks/host-shared-vpc-us-east1-subnet-public'
    }
  ]
};

const mockedGKEClustersResponse = {
  clusters: [
    { name: 'test1', status: 'RUNNING' },
    { name: 'test2', status: 'ERROR' },
    { name: 'test3', status: 'PROVISIONING' }
  ]
};

export function getGKEZones() {
  return new Promise((resolve) => {
    resolve(mockedGKEZonesResponse);
  });
}

export function getGKEVersions() {
  return new Promise((resolve) => {
    resolve(mockedGKEVersionsResponse);
  });
}

export function getGKEMachineTypes() {
  return new Promise((resolve) => {
    resolve(mockedGKEMachinesResponse);
  });
}

export function getGKENetworks() {
  return new Promise((resolve) => {
    resolve(mockedGKENetworksResponse);
  });
}

export function getGKESubnetworks() {
  return new Promise((resolve) => {
    resolve(mockedGKESubnetworksResponse);
  });
}

export function getGKESharedSubnetworks() {
  return new Promise((resolve) => {
    resolve(mockedGKESharedSubnetworksResponse);
  });
}

export function getGKEClusters(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}) {
  return new Promise((resolve) => {
    if (location.zone === 'mocked-empty-response') {
      resolve(null);
    }
    resolve(mockedGKEClustersResponse);
  });
}

export function getGKERegionFromZone(zone): string|undefined {
  const regionUrl = zone.region || '';

  return regionUrl.split('/').pop();
}
