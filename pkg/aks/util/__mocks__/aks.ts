export const mockRegions = [{ name: 'a' }, { name: 'b' }];

export const mockVersions = ['1.27.0', '1.26.0', '1.25.0', '1.24.0'];

export const getAKSOptions = (ctx: any, azureCredentialSecret: string, resourceLocation: string, clusterId: string, resource: string) => {
  return new Promise((resolve, reject) => {
    switch (resource) {
    case 'aksLocations':
      resolve(mockRegions);
      break;
    case 'aksVersions':
      resolve(mockVersions);
      break;
    default:
      resolve(['a', 'b']);
      break;
    }
  });
};
