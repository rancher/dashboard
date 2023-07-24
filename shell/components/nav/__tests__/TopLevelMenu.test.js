import TopLevelMenu from '@shell/components/nav/TopLevelMenu.vue';
import { EXPLORER_HARVESTER_CLUSTER } from '@shell/store/features';

describe('component: TopLevelMenu', () => {
  it('should enalble explorerHarvesterCluster feature', () => {
    const getFeature = jest.fn(() => true);
    const localThis = { features: getFeature };

    expect(TopLevelMenu.computed.explorerHarvesterClusterEnabled.call(localThis)).toBe(true);
    expect(getFeature).toHaveBeenCalledWith(EXPLORER_HARVESTER_CLUSTER);
  });
  it('should disable explorerHarvesterCluster feature', () => {
    const getFeature = jest.fn(() => false);
    const localThis = { features: getFeature };

    expect(TopLevelMenu.computed.explorerHarvesterClusterEnabled.call(localThis)).toBe(false);
    expect(getFeature).toHaveBeenCalledWith(EXPLORER_HARVESTER_CLUSTER);
  });

  it('should contain harvester cluster', () => {
    const getFeature = jest.fn(() => true);
    const harvester = {
      isHarvester: true,
      id:          'harvester'
    };
    const localThis = {
      explorerHarvesterClusterEnabled: true,
      features:                        getFeature,
      $store:                          {
        getters: {
          'management/all':  jest.fn(() => [harvester]),
          'management/byId': jest.fn()
        }
      }
    };

    expect(TopLevelMenu.computed.clusters.call(localThis).map(c => ({ id: c.id, isHarvester: c.isHarvester }))).toContainEqual(harvester);
  });

  it('should not contain harvester cluster', () => {
    const getFeature = jest.fn(() => false);
    const harvester = {
      isHarvester: true,
      id:          'harvester'
    };
    const localThis = {
      explorerHarvesterClusterEnabled: false,
      features:                        getFeature,
      $store:                          {
        getters: {
          'management/all':  jest.fn(() => [harvester]),
          'management/byId': jest.fn(),
          'features/get':    jest.fn(() => false)
        }
      }
    };

    expect(TopLevelMenu.computed.clusters.call(localThis)).toHaveLength(0);
  });
});
