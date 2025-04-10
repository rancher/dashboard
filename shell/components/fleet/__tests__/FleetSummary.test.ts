import { mount } from '@vue/test-utils';
import GitRepo from '@shell/models/fleet.cattle.io.gitrepo';
import FleetSummary from '@shell/components/fleet/FleetSummary.vue';

const REPO_NAME = 'testrepo';

const REPO_NAME_VARIANT = 'testrepo-again';

const CLUSTER_NAME = 'testcluster';

const mockedBundlesInRepo = [{
  id:         `fleet-default/${ REPO_NAME }-${ CLUSTER_NAME }-1234`,
  type:       'fleet.cattle.io.bundle',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'Bundle',
  repoName:   REPO_NAME,
  namespace:  'fleet-default',
  metadata:   {
    labels: {
      'fleet.cattle.io/commit':    '3640888439d1b7b6a53dbeee291a533eea2632ab',
      'fleet.cattle.io/repo-name': REPO_NAME
    },
    name:      `${ REPO_NAME }-${ CLUSTER_NAME }-1234`,
    namespace: 'fleet-default',
    state:     {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
  },
  spec: {
    correctDrift:        { },
    forceSyncGeneration: 2,
    ignore:              { },
    namespace:           'custom-namespace-name',
    resources:           [
      {
        content: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: configmap-test\n  annotations:\n    {}\n#    key: string\n  labels:\n    {}\n#    key: string\ndata:\n  key1: val1\n  key2: val2\n  key3: val3',
        name:    'test-configmap.yaml'
      }
    ],
    targets: [
      {
        clusterName: 'nb-cluster0-28',
        namespace:   'custom-namespace-name'
      }
    ]
  }
},
{
  id:         `fleet-default/${ REPO_NAME }-${ CLUSTER_NAME }-5678`,
  type:       'fleet.cattle.io.bundle',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'Bundle',
  repoName:   REPO_NAME,
  namespace:  'fleet-default',
  metadata:   {
    labels: {
      'fleet.cattle.io/commit':    '3640888439d1b7b6a53dbeee291a533eea2632ab',
      'fleet.cattle.io/repo-name': REPO_NAME
    },
    name:      `${ REPO_NAME }-${ CLUSTER_NAME }-5678`,
    namespace: 'fleet-default',
    state:     {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
  },
  spec: {
    correctDrift:        { },
    forceSyncGeneration: 2,
    ignore:              { },
    namespace:           'custom-namespace-name',
    resources:           [
      {
        content: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-cluster0\n  labels:\n    app: nginx\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:latest\n        ports:\n        - containerPort: 80',
        name:    'nginx.yml'
      },
    ],
    targets: [
      {
        clusterName: 'nb-cluster0-28',
        namespace:   'custom-namespace-name'
      }
    ]
  }
}];

const mockedBundlesOutOfRepo = [{
  id:         `fleet-default/${ REPO_NAME_VARIANT }-${ CLUSTER_NAME }-1234`,
  type:       'fleet.cattle.io.bundle',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'Bundle',
  repoName:   REPO_NAME_VARIANT,
  namespace:  'custom-namespace',
  metadata:   {
    labels: {
      'fleet.cattle.io/commit':    '3640888439d1b7b6a53dbeee291a533eea2632ab',
      'fleet.cattle.io/repo-name': REPO_NAME_VARIANT
    },
    name:      `${ REPO_NAME_VARIANT }-${ CLUSTER_NAME }-1234`,
    namespace: 'custom-namespace',
    state:     {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
  },
  spec: {
    correctDrift:        { },
    forceSyncGeneration: 2,
    ignore:              { },
    namespace:           'custom-namespace-name',
    resources:           [
      {
        content: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: configmap-test\n  annotations:\n    {}\n#    key: string\n  labels:\n    {}\n#    key: string\ndata:\n  key1: val1\n  key2: val2\n  key3: val3',
        name:    'test-configmap.yaml'
      }
    ],
    targets: [
      {
        clusterName: 'nb-cluster0-28',
        namespace:   'custom-namespace-name'
      }
    ]
  }
},
{
  id:         `fleet-default/${ REPO_NAME }-${ CLUSTER_NAME }-1234`,
  type:       'fleet.cattle.io.bundle',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'Bundle',
  repoName:   REPO_NAME,
  namespace:  'custom-namespace',
  metadata:   {
    labels: {
      'fleet.cattle.io/commit':    '3640888439d1b7b6a53dbeee291a533eea2632ab',
      'fleet.cattle.io/repo-name': REPO_NAME
    },
    name:      `${ REPO_NAME }-${ CLUSTER_NAME }-1234`,
    namespace: 'custom-namespace',
    state:     {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
  },
  spec: {
    correctDrift:        { },
    forceSyncGeneration: 2,
    ignore:              { },
    namespace:           'custom-namespace-name',
    resources:           [
      {
        content: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: configmap-test\n  annotations:\n    {}\n#    key: string\n  labels:\n    {}\n#    key: string\ndata:\n  key1: val1\n  key2: val2\n  key3: val3',
        name:    'test-configmap.yaml'
      }
    ],
    targets: [
      {
        clusterName: 'nb-cluster0-28',
        namespace:   'custom-namespace-name'
      }
    ]
  }
},
{
  id:         `fleet-default/${ REPO_NAME_VARIANT }-${ CLUSTER_NAME }-5678`,
  type:       'fleet.cattle.io.bundle',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'Bundle',
  repoName:   REPO_NAME_VARIANT,
  namespace:  'custom-namespace',
  metadata:   {
    labels: {
      'fleet.cattle.io/commit':    '3640888439d1b7b6a53dbeee291a533eea2632ab',
      'fleet.cattle.io/repo-name': REPO_NAME_VARIANT
    },
    name:      `${ REPO_NAME_VARIANT }-${ CLUSTER_NAME }-5678`,
    namespace: 'custom-namespace',
    state:     {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
  },
  spec: {
    correctDrift:        { },
    forceSyncGeneration: 2,
    ignore:              { },
    namespace:           'custom-namespace-name',
    resources:           [
      {
        content: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-cluster0\n  labels:\n    app: nginx\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:latest\n        ports:\n        - containerPort: 80',
        name:    'nginx.yml'
      },
    ],
    targets: [
      {
        clusterName: 'nb-cluster0-28',
        namespace:   'custom-namespace-name'
      }
    ]
  }
}];

const mockRepo = {
  id:         `fleet-default/${ REPO_NAME }`,
  type:       'fleet.cattle.io.gitrepo',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'GitRepo',
  metadata:   {
    name:      `${ REPO_NAME }`,
    namespace: 'fleet-default',
    state:     {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
  },
  spec: {
    branch:                'main',
    correctDrift:          { enabled: false },
    forceSyncGeneration:   2,
    insecureSkipTLSVerify: false,
    paths:                 [
      './cluster0'
    ],
    repo:            'https://github.com/testuser/testrepo.git',
    targetNamespace: 'custom-namespace-name',
    targets:         [
      { clusterName: `${ CLUSTER_NAME }` }
    ]
  },
  status: {
    commit:     '3640888439d1b7b6a53dbeee291a533eea2632ab',
    conditions: [
      {
        error:          false,
        lastUpdateTime: '2023-10-05T18:06:27Z',
        status:         'True',
        transitioning:  false,
        type:           'Ready'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-05T20:35:07Z',
        status:         'True',
        transitioning:  false,
        type:           'Accepted'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-05T18:05:09Z',
        status:         'True',
        transitioning:  false,
        type:           'ImageSynced'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-05T18:06:22Z',
        status:         'False',
        transitioning:  false,
        type:           'Reconciling'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-05T18:05:09Z',
        status:         'False',
        transitioning:  false,
        type:           'Stalled'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-05T20:35:07Z',
        status:         'True',
        transitioning:  false,
        type:           'Synced'
      }
    ],
    desiredReadyClusters:    1,
    display:                 { readyBundleDeployments: '2/2' },
    gitJobStatus:            'Current',
    lastSyncedImageScanTime: null,
    observedGeneration:      2,
    readyClusters:           1,
    resourceCounts:          {
      desiredReady: 2,
      missing:      0,
      modified:     0,
      notReady:     0,
      orphaned:     0,
      ready:        2,
      unknown:      0,
      waitApplied:  0
    },
    resources: [
      {
        apiVersion: 'apps/v1',
        id:         'custom-namespace-name/nginx-cluster0',
        kind:       'Deployment',
        name:       'nginx-cluster0',
        namespace:  'custom-namespace-name',
        state:      'Ready',
        type:       'apps.deployment'
      },
      {
        apiVersion: 'v1',
        id:         'custom-namespace-name/configmap-test',
        kind:       'ConfigMap',
        name:       'configmap-test',
        namespace:  'custom-namespace-name',
        state:      'Ready',
        type:       'configmap'
      }
    ],
    summary: {
      desiredReady: 1,
      ready:        1
    }
  }
};

const mockStore = { getters: { 'i18n/withFallback': (key, opt, fallback) => fallback } };

describe('component: FleetSummary', () => {
  it.each([
    [[...mockedBundlesInRepo, ...mockedBundlesOutOfRepo], '2'],
    [mockedBundlesInRepo, '2'],
  ])('displays the number of bundles associated with the current gitrepo', (bundles: any[], bundleCount: string) => {
    const wrapper = mount(FleetSummary, {
      props:  { bundles, value: new GitRepo(mockRepo) },
      global: { mocks: { $store: mockStore } }
    });

    const bundleCountEl = wrapper.find('[data-testid="gitrepo-bundle-summary"] .count');

    expect(bundleCountEl.text()).toBe(bundleCount);
  });

  it.each([
    [[...mockedBundlesInRepo, ...mockedBundlesOutOfRepo], '2'],
    [mockedBundlesInRepo, '2'],

  ])('displays the number of deployments associated with the current gitrepo', (bundles: any[], bundleCount: string) => {
    const wrapper = mount(FleetSummary, {
      props:  { bundles, value: new GitRepo(mockRepo) },
      global: { mocks: { $store: mockStore } }
    });

    const bundleCountEl = wrapper.find('[data-testid="gitrepo-deployment-summary"] .count');

    expect(bundleCountEl.text()).toBe(bundleCount);
  });
});
