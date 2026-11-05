import CRTB from '@shell/models/management.cattle.io.clusterroletemplatebinding';

describe('class CRTB', () => {
  describe('clusterDetailLocation', () => {
    it('should link to the explorer of the bound cluster when the cluster can be explored', () => {
      const crtb = new CRTB({ clusterName: 'c-m-abcde' }, { rootGetters: { 'management/byId': () => ({ canExplore: true }) } });

      expect(crtb.clusterDetailLocation).toStrictEqual({ name: 'c-cluster-explorer', params: { cluster: 'c-m-abcde' } });
    });

    it.each([
      ['cannot be explored', { canExplore: false }],
      ['is not loaded', undefined],
    ])('should not link when the cluster %s', (_, cluster) => {
      const crtb = new CRTB({ clusterName: 'c-m-abcde' }, { rootGetters: { 'management/byId': () => cluster } });

      expect(crtb.clusterDetailLocation).toBeNull();
    });
  });
});
