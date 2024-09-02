import { ignoreVariables } from '@shell/pages/c/_cluster/apps/charts/install.helpers';

describe('fX: ignoreVariables', () => {
  describe.each([['epinio', 'global.rbac.pspEnabled']])('given chart %p with path %p', (name, path) => {
    it.each([
      ['v1.25.11+rke2r1'],
    ])('should return questions', () => {
      const data = {
        chart:  { name },
        values: { global: { rbac: { pspEnabled: undefined } } }
      };

      const paths = ignoreVariables(data);

      expect(paths).toStrictEqual([path]);
    });
  });
});
