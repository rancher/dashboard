import Project from '@shell/models/management.cattle.io.project';
import { MANAGEMENT } from '@shell/config/types';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';

describe('class Project', () => {
  const createProject = (currentProduct: { name: string, inStore: string }, currentClusterId: string) => {
    const ctx = {
      getters:     { schemaFor: () => ({ attributes: { namespaced: true } }) },
      rootGetters: {
        currentProduct,
        productId: currentProduct.name,
        clusterId: currentClusterId,
      },
      rootState: { $extension: { getPlugins: () => ({}) } },
    };

    return new Project({
      id:       'local/p-abcde',
      type:     MANAGEMENT.PROJECT,
      metadata: { name: 'p-abcde', namespace: 'local' },
      spec:     { clusterName: 'local' },
    }, ctx);
  };

  describe('detailLocation', () => {
    it.each([
      ['auth', 'c-m-other'],
      ['settings', 'c-m-other'],
      [EXPLORER, 'local'],
    ])('should link to the project in its own cluster in the explorer when the current product is %p and the current cluster is %p', (product, currentClusterId) => {
      const project = createProject({ name: product, inStore: 'management' }, currentClusterId);

      expect(project.detailLocation).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   'local',
          product:   EXPLORER,
          resource:  MANAGEMENT.PROJECT,
          namespace: 'local',
          id:        'p-abcde',
        }
      });
    });

    it('should keep the harvester route and the current cluster when the current product is harvester', () => {
      const project = createProject({ name: HARVESTER, inStore: HARVESTER }, 'c-m-harvester');

      expect(project.detailLocation).toStrictEqual({
        name:   `${ HARVESTER }-c-cluster-resource-namespace-id`,
        params: {
          product:   HARVESTER,
          cluster:   'c-m-harvester',
          resource:  MANAGEMENT.PROJECT,
          namespace: 'local',
          id:        'p-abcde',
        }
      });
    });
  });
});
