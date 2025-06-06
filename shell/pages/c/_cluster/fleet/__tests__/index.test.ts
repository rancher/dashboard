import { mount, RouterLinkStub } from '@vue/test-utils';
import Dashboard from '@shell/pages/c/_cluster/fleet/index.vue';
import { FLEET } from '@shell/config/types';

const fleetWorkspaces = [
  {
    id:         'fleet-local',
    type:       'management.cattle.io.fleetworkspace',
    apiVersion: 'management.cattle.io/v3',
    kind:       'FleetWorkspace',
    metadata:   {
      annotations:       { 'provisioning.cattle.io/managed': 'false' },
      creationTimestamp: '2025-03-24T08:55:59Z',
      fields:            [
        'fleet-local',
        '44d'
      ],
      generation:      1,
      name:            'fleet-local',
      ownerReferences: [
        {
          apiVersion: 'v1',
          kind:       'Namespace',
          name:       'fleet-local',
          uid:        '481ca51a-a855-4342-8932-a8753b5ff1ff'
        }
      ],
      relationships: [
        {
          fromId:   'fleet-local',
          fromType: 'namespace',
          rel:      'owner',
          state:    'active'
        }
      ],
      resourceVersion: '1362',
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: 'c117994d-5d21-4ac5-97be-15f25c5e8801'
    },
    status: {}
  },
  {
    id:         'fleet-default',
    type:       'management.cattle.io.fleetworkspace',
    apiVersion: 'management.cattle.io/v3',
    kind:       'FleetWorkspace',
    metadata:   {
      annotations:       { 'provisioning.cattle.io/managed': 'false' },
      creationTimestamp: '2025-03-24T08:55:59Z',
      fields:            [
        'fleet-default',
        '44d'
      ],
      generation:      1,
      name:            'fleet-default',
      ownerReferences: [
        {
          apiVersion: 'v1',
          kind:       'Namespace',
          name:       'fleet-default',
          uid:        '481ca51a-a855-4342-8932-a8753b5ff1ff'
        }
      ],
      relationships: [
        {
          fromId:   'fleet-default',
          fromType: 'namespace',
          rel:      'owner',
          state:    'active'
        }
      ],
      resourceVersion: '1362',
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: 'c117994d-5d21-4ac5-97be-15f25c5e8801'
    },
    status: {}
  }
];

const gitRepos = [
  {
    id:         'fleet-default/lots-a',
    type:       'fleet.cattle.io.gitrepo',
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'GitRepo',

    metadata: {
      annotations:       {},
      creationTimestamp: '2025-03-24T09:09:56Z',
      fields:            [
        'lots-a',
        'https://github.com/git-repo',
        '420bf95e3d5ac89a7801deb0bc1206a5abc54b45',
        '17/20',
        'Modified(2) [Cluster fleet-default/fleet-1; configmap.v1 lots-a/test-config-eight missing'
      ],
      finalizers: [
        'fleet.cattle.io/gitrepo-finalizer'
      ],
      generation:      1,
      name:            'lots-a',
      namespace:       'fleet-default',
      resourceVersion: '22615976',
      state:           {
        error:         false,
        message:       '',
        name:          'modified',
        transitioning: false
      },
      uid: 'd70cd36b-9cb9-4913-b0ec-0e3a2d7b92fd'
    },
    spec: {
      branch: 'main',
      paths:  [
        'scale'
      ],
      repo:            'https://github.com/git-repo',
      targetNamespace: 'lots-a',
      targets:         [
        { clusterSelector: {} }
      ]
    },
    status: {
      commit:     '420bf95e3d5ac89a7801deb0bc1206a5abc54b45',
      conditions: [
        {
          error:          true,
          lastUpdateTime: '2025-05-04T16:33:15Z',
          message:        'Modified(2) [Cluster fleet-default/fleet-1]; configmap.v1 lots-a/test-config-eight missing',
          status:         'False',
          transitioning:  true,
          type:           'Ready'
        },
        {
          error:          false,
          lastUpdateTime: '2025-05-07T09:39:08Z',
          status:         'True',
          transitioning:  false,
          type:           'GitPolling'
        },
        {
          error:          false,
          lastUpdateTime: '2025-03-24T09:09:57Z',
          status:         'False',
          transitioning:  false,
          type:           'Reconciling'
        },
        {
          error:          false,
          lastUpdateTime: '2025-03-24T09:09:57Z',
          status:         'False',
          transitioning:  false,
          type:           'Stalled'
        },
        {
          error:          false,
          lastUpdateTime: '2025-03-24T09:09:57Z',
          status:         'True',
          transitioning:  false,
          type:           'Accepted'
        }
      ],
      desiredReadyClusters: 2,
      display:              {
        readyBundleDeployments: '1/2',
        state:                  'Modified'
      },
      gitJobStatus:             'Current',
      lastPollingTriggered:     '2025-05-07T13:34:43Z',
      observedGeneration:       1,
      perClusterResourceCounts: {
        'fleet-default/fleet-1': {
          desiredReady: 2,
          missing:      1,
          modified:     0,
          notReady:     0,
          orphaned:     0,
          ready:        1,
          unknown:      0,
          waitApplied:  0
        },
        'fleet-default/fleet-2': {
          desiredReady: 2,
          missing:      1,
          modified:     0,
          notReady:     0,
          orphaned:     0,
          ready:        1,
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
        ready:        1,
        unknown:      0,
        waitApplied:  0
      },
      resources: [
        {
          apiVersion:      'v1',
          id:              'lots-a/test-config-eight',
          kind:            'ConfigMap',
          name:            'test-config-eight',
          namespace:       'lots-a',
          perClusterState: {
            missing: [
              'fleet-default/fleet-1'
            ]
          },
          state: 'Missing',
          type:  'configmap'
        },
        {
          apiVersion:      'v1',
          id:              'lots-a/test-config-five',
          kind:            'ConfigMap',
          name:            'test-config-five',
          namespace:       'lots-a',
          perClusterState: {
            missing: [
              'fleet-default/fleet-1'
            ],
            ready: [
              'fleet-default/fleet-2'
            ]
          },
          state: 'Missing',
          type:  'configmap'
        }
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
                name:       'test-config-five',
                namespace:  'lots-a'
              }
            ],
            name: 'lots-a-scale-lotsofbundles-five'
          }
        ],
        ready: 1
      }
    }
  }
];

const requiredSetup = (computed = {}, dataProps = {}) => {
  return {
    global: {
      mocks: {
        $store: {
          getters: {
            currentProduct:         { inStore: 'cluster' },
            'management/schemaFor': jest.fn(),
            'rancher/byId':         jest.fn(),
            'i18n/t':               (text: string) => text,
            t:                      (text: string) => text,
          },
          dispatch: jest.fn()
        },
        $fetchState: {},
      },
      stubs:      { 'router-link': RouterLinkStub },
      directives: { 'trim-whitespace': (id: any) => id },
    },
    computed: {
      ...Dashboard.computed,
      allNamespaces: () => [],
      workspaces:    () => [],
      ...computed
    },
    data: () => ({
      permissions:           {},
      FLEET,
      [FLEET.GIT_REPO]:      [],
      [FLEET.HELM_OP]:       [],
      [FLEET.CLUSTER]:       [],
      [FLEET.CLUSTER_GROUP]: [],
      fleetWorkspaces:       [],
      viewModeOptions:       [
        {
          // tooltipKey: 'fleet.dashboard.viewMode.table',
          icon:     'icon-list-flat',
          value:    'flat',
          disabled: true
        },
        {
          tooltipKey: 'fleet.dashboard.viewMode.cards',
          icon:       'icon-apps',
          value:      'cards',
        },
      ],
      viewMode:             {},
      isWorkspaceCollapsed: {},
      isStateCollapsed:     {},
      typeFilter:           {},
      stateFilter:          {},
      selectedCard:         null,
      ...dataProps
    })
  } as any;
};

describe('component: FleetDashboard', () => {
  it('no workspaces', () => {
    const wrapper = mount(Dashboard, { ...requiredSetup() });

    const noWorkspaces = wrapper.find(`[data-testid="fleet-no-workspaces"]`);
    const noResources = wrapper.find(`[data-testid="fleet-empty-dashboard"]`);
    const workspaceCards = wrapper.find(`[data-testid="fleet-dashboard-workspace-cards"]`);

    expect(workspaceCards.exists()).toBeFalsy();
    expect(noWorkspaces.exists()).toBeTruthy();
    expect(noResources.exists()).toBeFalsy();
  });

  it('no resources', () => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
      ),
    });

    const noWorkspaces = wrapper.find(`[data-testid="fleet-no-workspaces"]`);
    const noResources = wrapper.find(`[data-testid="fleet-empty-dashboard"]`);
    const workspaceCards = wrapper.find(`[data-testid="fleet-dashboard-workspace-cards"]`);

    expect(workspaceCards.exists()).toBeFalsy();
    expect(noWorkspaces.exists()).toBeFalsy();
    expect(noResources.exists()).toBeTruthy();
  });

  it('show workspace cards', () => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        { [FLEET.GIT_REPO]: gitRepos }
      ),
    });

    const noWorkspaces = wrapper.find(`[data-testid="fleet-no-workspaces"]`);
    const noResources = wrapper.find(`[data-testid="fleet-empty-dashboard"]`);
    const workspaceCards = wrapper.find(`[data-testid="fleet-dashboard-workspace-cards"]`);

    expect(noWorkspaces.exists()).toBeFalsy();
    expect(noResources.exists()).toBeFalsy();
    expect(workspaceCards.exists()).toBeTruthy();
  });

  it.each([
    ['fleet-local', 'expanded', true],
    ['fleet-default', 'expanded', true],
    ['fleet-local', 'collapsed', false],
    ['fleet-default', 'collapsed', false],
  ])('%p workspace card is %p', async(workspace, _, collapsed) => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        {
          [FLEET.GIT_REPO]:     gitRepos,
          isWorkspaceCollapsed: { [workspace]: collapsed }
        }
      ),
    });
    const expandedPanel = wrapper.find(`[data-testid="fleet-dashboard-expanded-panel-${ workspace }"]`);

    expect(expandedPanel.exists()).toBe(!collapsed);
  });

  // it.each([
  //   ['git-repos', true],
  //   ['helm-ops', false],
  //   ['git-repos', true],
  //   ['helm-ops', false],
  // ])('filter %p %p', async(type, isFiltered) => {
  //   const wrapper = mount(Dashboard, {
  //     ...requiredSetup(
  //       {
  //         workspaces: () => [ fleetWorkspaces[1] ],
  //       },
  //       {
  //         [FLEET.GIT_REPO]: gitRepos,
  //       }
  //     ),
  //   });

  //   const statePanel = wrapper.find(`[data-testid="state-panel-Modified"]`);
  //   const gitRepoCard1 = wrapper.find(`[data-testid="card-${ gitRepos[0].id }"]`);
  //   const filterCheckbox = wrapper.find(`[data-testid="fleet-dashboard-filter-${ type }"]`);

  //   filterCheckbox.setValue(false);
  //   expect(filterCheckbox.exists()).toBe(true);
  // });
});
