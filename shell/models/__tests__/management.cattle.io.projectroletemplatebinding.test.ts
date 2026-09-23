import PRTB from '@shell/models/management.cattle.io.projectroletemplatebinding';
import { MANAGEMENT } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';

describe('class PRTB', () => {
  describe('projectDetailLocation', () => {
    it('should use the project detail location when the project is loaded', () => {
      const projectLocation = { name: 'project-location' };
      const prtb = new PRTB({ projectName: 'local:p-abcde' }, { rootGetters: { 'management/byId': () => ({ detailLocation: projectLocation }) } });

      expect(prtb.projectDetailLocation).toStrictEqual(projectLocation);
    });

    it.each([
      ['local:p-abcde', 'local', 'p-abcde'],
      ['c-m-abcde:p-fghij', 'c-m-abcde', 'p-fghij'],
    ])('should link to the project in its own cluster in the explorer when %p is not loaded', (projectName, cluster, id) => {
      const prtb = new PRTB({ projectName }, { rootGetters: { 'management/byId': () => undefined } });

      expect(prtb.projectDetailLocation).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster,
          product:   EXPLORER,
          resource:  MANAGEMENT.PROJECT,
          namespace: cluster,
          id,
        }
      });
    });
  });

  describe('clusterDetailLocation', () => {
    it('should link to the explorer of the project\'s cluster when the cluster can be explored', () => {
      const prtb = new PRTB({ projectName: 'c-m-abcde:p-fghij' }, { rootGetters: { 'management/byId': () => ({ canExplore: true }) } });

      expect(prtb.clusterDetailLocation).toStrictEqual({ name: 'c-cluster-explorer', params: { cluster: 'c-m-abcde' } });
    });

    it.each([
      ['cannot be explored', { canExplore: false }],
      ['is not loaded', undefined],
    ])('should not link when the cluster %s', (_, cluster) => {
      const prtb = new PRTB({ projectName: 'c-m-abcde:p-fghij' }, { rootGetters: { 'management/byId': () => cluster } });

      expect(prtb.clusterDetailLocation).toBeNull();
    });
  });
});
