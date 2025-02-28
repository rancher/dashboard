import GitRepo from '@shell/models/fleet.cattle.io.gitrepo.js';

const status = {
  commit:     'foo',
  conditions: [
    {
      error:          true,
      lastUpdateTime: '2025-02-28T15:39:52Z',
      message:        'Modified(1) [Cluster fleet-local/local]; configmap.v1 lots-a/test-config-one missing',
      status:         'False',
      transitioning:  true,
      type:           'Ready'
    },
    {
      error:          false,
      lastUpdateTime: '2025-02-28T15:36:25Z',
      status:         'True',
      transitioning:  false,
      type:           'GitPolling'
    },
    {
      error:          false,
      lastUpdateTime: '2025-02-28T15:36:25Z',
      status:         'False',
      transitioning:  false,
      type:           'Reconciling'
    },
    {
      error:          false,
      lastUpdateTime: '2025-02-28T15:36:25Z',
      status:         'False',
      transitioning:  false,
      type:           'Stalled'
    },
    {
      error:          false,
      lastUpdateTime: '2025-02-28T15:36:25Z',
      status:         'True',
      transitioning:  false,
      type:           'Accepted'
    }
  ],
  desiredReadyClusters: 1,
  display:              {
    readyBundleDeployments: '1/2',
    state:                  'Modified'
  },
  gitJobStatus:             'Current',
  lastPollingTriggered:     '2025-02-28T16:08:39Z',
  observedGeneration:       1,
  perClusterResourceCounts: {
    'fleet-local/local': {
      desiredReady: 2,
      missing:      1,
      modified:     0,
      notReady:     0,
      orphaned:     0,
      ready:        2,
      unknown:      0,
      waitApplied:  0
    }
  },
  readyClusters:  0,
  resourceCounts: {
    desiredReady: 2,
    missing:      1,
    modified:     0,
    notReady:     0,
    orphaned:     0,
    ready:        2,
    unknown:      0,
    waitApplied:  0
  },
  resources: [
    {
      apiVersion:      'v1',
      id:              'lots-a/test-config-one',
      kind:            'ConfigMap',
      name:            'test-config-one',
      namespace:       'lots-a',
      perClusterState: {
        missing: [
          'fleet-local/local'
        ]
      },
      state: 'Missing',
      type:  'configmap'
    },
    {
      apiVersion:      'v1',
      id:              'lots-a/test-config-two',
      kind:            'ConfigMap',
      name:            'test-config-two',
      namespace:       'lots-a',
      perClusterState: {
        ready: [
          'fleet-local/local'
        ]
      },
      state: 'Ready',
      type:  'configmap'
    },
  ],
  summary: {
    desiredReady:      2,
    modified:          1,
    nonReadyResources: [
      {
        bundleState:    'Modified',
        modifiedStatus: [
          {
            apiVersion: 'v1',
            kind:       'ConfigMap',
            missing:    true,
            name:       'test-config-one',
            namespace:  'lots-a'
          }
        ],
        name: 'lots-a-scale-lotsofbundles-one'
      }
    ],
    ready: 1
  }
};

describe('class GitRepo', () => {
  describe('resourcesStatuses', () => {
    it.each([
      []
    ])('foobat', () => {
      jest.spyOn(GitRepo.prototype, '$getters', 'get').mockReturnValue({ byId: jest.fn() });

      jest.spyOn(GitRepo.prototype, 'targetClusters', 'get').mockReturnValue([{
        id:       'fleet-local/local',
        metadata: { labels: {} }
      }]);

      const gitRepo = new GitRepo({
        metadata: { namespace: 'fleet-local' },
        spec:     {},
        status
      });

      const resourcesStatuses = gitRepo.resourcesStatuses;

      const resource1 = resourcesStatuses.find((el: any) => el.id === 'lots-a/test-config-one');

      expect(resource1.state).toStrictEqual('missing');
      expect(resource1.detailLocation).toBeUndefined();

      const resource2 = resourcesStatuses.find((el: any) => el.id === 'lots-a/test-config-two');

      expect(resource2.state).toStrictEqual('ready');
      expect(resource2.detailLocation).toBeDefined();
    });
  });
});
