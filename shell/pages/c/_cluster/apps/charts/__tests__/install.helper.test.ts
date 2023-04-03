import { ignoreVariables } from '@shell/pages/c/_cluster/apps/charts/install.helpers';

describe('fX: ignoreVariables', () => {
  describe.each([['epinio', 'global.rbac.pspEnabled']])('given chart %p with path %p', (name, path) => {
    it.each([
      ['v1.24.11+rke2r1'],
    ])('should not return variable path list if cluster has k8s version %p', (version) => {
      const cluster = { kubernetesVersion: version };
      const data = {
        chart:  { name },
        values: { global: { rbac: { pspEnabled: undefined } } }
      };

      const paths = ignoreVariables(cluster, data);

      expect(paths).toStrictEqual([]);
    });

    it.each([
      ['v1.25.11+rke2r1'],
    ])('should return questions if cluster has k8s version %p', (version) => {
      const cluster = { kubernetesVersion: version };
      const data = {
        chart:  { name },
        values: { global: { rbac: { pspEnabled: undefined } } }
      };

      const paths = ignoreVariables(cluster, data);

      expect(paths).toStrictEqual([path]);
    });
  });
});
