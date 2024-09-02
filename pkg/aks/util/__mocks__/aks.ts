export const mockRegions = [{ name: 'a' }, { name: 'b' }];

export const mockVersions = ['1.25.0', '1.26.0', '1.27.0', '1.24.0'];

export const mockVersionsSorted = ['1.27.0', '1.26.0', '1.25.0', '1.24.0'];

export const mockSizes = ['size1', 'size2', 'size3'];

export const mockNetworks = [
  {
    name: 'network1', resourceGroup: 'network1Group', subnets: null
  },
  {
    name:          'network2',
    resourceGroup: 'network2Group',
    subnets:       [
      { name: 'network2-subnet1', addressRange: '10.224.0.0/16' },
      { name: 'network2-subnet2', addressRange: '10.1.0.0/24' },

    ]
  },
  {
    name:          'network3',
    resourceGroup: 'network3Group',
    subnets:       [
      { name: 'network3-subnet1', addressRange: '10.224.0.0/16' },
      { name: 'network3-subnet2', addressRange: '10.1.0.0/24' },
      { name: 'network3-subnet2', addressRange: '' },
    ]
  }
];

export const regionsWithAvailabilityZones = ['a'];

export async function getAKSRegions() :Promise<any> {
  return new Promise((resolve, reject) => {
    resolve(mockRegions);
  });
}

export async function getAKSVMSizes(ctx: any, azureCredentialSecret: string, resourceLocation: string, clusterId: string) :Promise<any> {
  return new Promise((resolve, reject) => {
    resolve(mockSizes);
  });
}

export async function getAKSKubernetesVersions(ctx: any, azureCredentialSecret: string, resourceLocation: string, clusterId: string) :Promise<any> {
  return new Promise((resolve, reject) => {
    resolve(mockVersions);
  });
}

export async function getAKSVirtualNetworks(ctx: any, azureCredentialSecret: string, resourceLocation: string, clusterId: string) :Promise<any> {
  return new Promise((resolve, reject) => {
    resolve(mockNetworks);
  });
}
