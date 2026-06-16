import { mount, RouterLinkStub } from '@vue/test-utils';
import Dashboard from '@shell/pages/c/_cluster/fleet/index.vue';
import { FLEET } from '@shell/config/types';

const fleetWorkspaces = [
  {
    id:       'fleet-local',
    type:     'management.cattle.io.fleetworkspace',
    kind:     'FleetWorkspace',
    metadata: { name: 'fleet-local' },
    repos:    [{ name: 'lots-a' }],
    helmOps:  [{ name: 'lots-b' }]
  },
  {
    id:       'fleet-default',
    type:     'management.cattle.io.fleetworkspace',
    kind:     'FleetWorkspace',
    metadata: { name: 'fleet-default' },
    repos:    [{ name: 'lots-c' }],
    helmOps:  [{ name: 'lots-d' }]
  }
];

const gitRepos = [
  {
    id:           'fleet-default/lots-a',
    type:         FLEET.GIT_REPO,
    metadata:     { namespace: 'fleet-local' },
    nameDisplay:  'lots-a',
    stateDisplay: 'Active',
    stateSort:    'Active'
  }
];

const helmOps = [
  {
    id:           'helm-op-1',
    type:         FLEET.HELM_OP,
    metadata:     { namespace: 'fleet-local' },
    nameDisplay:  'helm-op-1',
    stateDisplay: 'Active',
    stateSort:    'Active'
  }
];

const requiredSetup = (computed = {}, dataProps = {}) => {
  return {
    global: {
      mocks: {
        $store: {
          getters: {
            currentProduct:           { inStore: 'cluster' },
            'management/schemaFor':   jest.fn(),
            'rancher/byId':           jest.fn(),
            'i18n/t':                 (text: string) => text,
            t:                        (text: string) => text,
            'slideInPanel/isOpen':    false,
            'slideInPanel/isClosing': false,
          },
          dispatch: jest.fn(),
          commit:   jest.fn(),
        },
        $fetchState: { pending: false },
        $router:     { push: jest.fn() },
        $shell:      { slideInPanel: jest.fn() },
        t:           (key: string) => key,
      },
      stubs: {
        'router-link': RouterLinkStub, ButtonGroup: true, Checkbox: true, RcButton: true, ResourcePanel: true, FleetApplications: true, ResourceCard: true, ResourceDetails: true, EmptyDashboard: true
      },
      directives: { 'trim-whitespace': (id: any) => id },
    },
    computed: {
      ...Dashboard.computed,
      allNamespaces: () => [],
      ...computed
    },
    data: () => ({
      presetVersion:         '1.2.3',
      permissions:           {},
      FLEET,
      [FLEET.GIT_REPO]:      [],
      [FLEET.HELM_OP]:       [],
      [FLEET.CLUSTER]:       [],
      [FLEET.CLUSTER_GROUP]: [],
      fleetWorkspaces:       [],
      viewModeOptions:       [
        {
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
      viewMode:             'cards',
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
  it('should render NoWorkspaces component when no workspaces are available and user has no permissions', async() => {
    const wrapper = mount(Dashboard, { ...requiredSetup() });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'Loading' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'NoWorkspaces' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'EmptyDashboard' }).exists()).toBe(false);
  });

  it('should render EmptyDashboard component when workspaces exist but no gitRepos or helmOps', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
      ),
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'Loading' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'NoWorkspaces' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'EmptyDashboard' }).exists()).toBe(true);
  });

  it('should render the dashboard when workspaces and resources exist', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        {
          [FLEET.GIT_REPO]: gitRepos,
          [FLEET.HELM_OP]:  helmOps,
        }
      ),
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.dashboard').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'Loading' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'NoWorkspaces' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'EmptyDashboard' }).exists()).toBe(false);
  });

  it('should render workspace cards', () => {
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
  ])('should %p workspace card be %p', async(workspace, _, collapsed) => {
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

  it('should workspaces return fleetWorkspaces if available', async() => {
    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.setData({ fleetWorkspaces });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.workspaces).toStrictEqual(fleetWorkspaces);
  });

  it('should allCardsExpanded be true if all workspaces are expanded', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        {
          isWorkspaceCollapsed: {
            'fleet-local':   false,
            'fleet-default': false
          },
        }
      ),
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.allCardsExpanded).toBe(true);
  });

  it('should allCardsExpanded return false if any workspace is collapsed', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        {
          isWorkspaceCollapsed: {
            'fleet-local':   true,
            'fleet-default': false
          },
        }
      ),
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.allCardsExpanded).toBe(false);
  });

  it('should selectStates toggle state filter and expands the workspace/state', async() => {
    const workspaceId = 'fleet-local';
    const stateDisplay = 'Modified';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.setData({
      stateFilter:          { [workspaceId]: {} },
      isWorkspaceCollapsed: { [workspaceId]: true },
      isStateCollapsed:     { [workspaceId]: { [stateDisplay]: true } }
    });

    await wrapper.vm.selectStates(workspaceId, stateDisplay);

    await wrapper.vm.$nextTick();

    // Should set stateFilter for Modified to true
    expect((wrapper.vm.stateFilter as any)[workspaceId][stateDisplay]).toBe(true);
    // Workspace should remain expanded
    expect((wrapper.vm.isWorkspaceCollapsed as any)[workspaceId]).toBe(false);
    // All states should be expanded
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][stateDisplay]).toBe(false);
  });

  it('should selectType toggle type filter and expands all states', async() => {
    const workspaceId = 'fleet-local';
    const stateDisplay = 'Modified';
    const type = FLEET.GIT_REPO;

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.setData({ isStateCollapsed: { [workspaceId]: { [stateDisplay]: true } } });

    await wrapper.vm.selectType(workspaceId, type, false);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm.typeFilter as any)[workspaceId][type]).toBe(false);

    // Should expand all states for that workspace
    Object.keys((wrapper.vm.isStateCollapsed as any)[workspaceId]).forEach((state) => {
      expect((wrapper.vm.isStateCollapsed as any)[workspaceId][state]).toBe(false);
    });
  });

  it('should toggleCard toggle the collapse state of a workspace card', async() => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    await wrapper.vm.toggleCard(workspaceId);
    expect((wrapper.vm.isWorkspaceCollapsed as any)[workspaceId]).toBe(true);

    await wrapper.vm.toggleCard(workspaceId);
    expect((wrapper.vm.isWorkspaceCollapsed as any)[workspaceId]).toBe(false);
  });

  it('should toggleCardAll expand or collapses all workspace cards', async() => {
    const wrapper = mount(Dashboard, { ...requiredSetup() });

    const ws1 = fleetWorkspaces[0].id;
    const ws2 = fleetWorkspaces[1].id;

    wrapper.vm.isWorkspaceCollapsed = {
      [ws1]: true,
      [ws2]: false,
    };

    await wrapper.vm.$nextTick();

    // Collapse all
    await wrapper.vm.toggleCardAll('collapse');
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws1]).toBe(true);
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws2]).toBe(true);

    // Expand all
    await wrapper.vm.toggleCardAll('expand');
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws1]).toBe(false);
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws2]).toBe(false);
  });

  it('should toggleState toggle the collapse state of a state panel', async() => {
    const workspaceId = 'fleet-local';
    const stateDisplay = 'Modified';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.setData({ isStateCollapsed: { [workspaceId]: { [stateDisplay]: true } } });

    await wrapper.vm.toggleState(workspaceId, stateDisplay);
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][stateDisplay]).toBe(false);

    await wrapper.vm.toggleState(workspaceId, stateDisplay);
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][stateDisplay]).toBe(true);
  });

  it('should toggleStateAll expand or collapse all state panels for a workspace', async() => {
    const workspaceId = 'fleet-local';

    const state1 = 'Modified';
    const state2 = 'Error';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.setData({ isStateCollapsed: { [workspaceId]: { [state1]: true } } });

    (wrapper.vm.isStateCollapsed as any)[workspaceId] = {
      [state1]: true,
      [state2]: false,
    };
    await wrapper.vm.$nextTick();

    // Collapse all states for the workspace
    await wrapper.vm.toggleStateAll(workspaceId, 'collapse');
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][state1]).toBe(true);
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][state2]).toBe(true);

    // Expand all states for the workspace
    await wrapper.vm.toggleStateAll(workspaceId, 'expand');
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][state1]).toBe(false);
    expect((wrapper.vm.isStateCollapsed as any)[workspaceId][state2]).toBe(false);
  });

  it('should loadMore increment cardsCount for a specific state', async() => {
    const workspaceId = 'fleet-local';
    const stateDisplay = 'Modified';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.vm.CARDS_MIN = 5;
    wrapper.vm.CARDS_SIZE = 5;

    expect((wrapper.vm.cardsCount as any)[workspaceId]).toBeUndefined();

    await wrapper.vm.loadMore(workspaceId, stateDisplay);
    expect((wrapper.vm.cardsCount as any)[workspaceId][stateDisplay]).toBe(wrapper.vm.CARDS_MIN + wrapper.vm.CARDS_SIZE);

    await wrapper.vm.loadMore(workspaceId, stateDisplay);
    expect((wrapper.vm.cardsCount as any)[workspaceId][stateDisplay]).toBe(wrapper.vm.CARDS_MIN + (2 * wrapper.vm.CARDS_SIZE));
  });

  it('should loadLess decrement cardsCount for a specific state, not going below CARDS_MIN', async() => {
    const workspaceId = 'fleet-local';
    const stateDisplay = 'Modified';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.vm.CARDS_MIN = 5;
    wrapper.vm.CARDS_SIZE = 5;

    (wrapper.vm.cardsCount as any)[workspaceId] = { [stateDisplay]: wrapper.vm.CARDS_MIN + (2 * wrapper.vm.CARDS_SIZE) }; // Start with enough to decrement
    await wrapper.vm.$nextTick();

    await wrapper.vm.loadLess(workspaceId, stateDisplay);
    expect((wrapper.vm.cardsCount as any)[workspaceId][stateDisplay]).toBe(wrapper.vm.CARDS_MIN + wrapper.vm.CARDS_SIZE);

    await wrapper.vm.loadLess(workspaceId, stateDisplay);
    expect((wrapper.vm.cardsCount as any)[workspaceId][stateDisplay]).toBe(wrapper.vm.CARDS_MIN);
  });

  it('should _resourceStates groups resources by stateDisplay and sorts them', () => {
    const resources = [
      {
        id: 'a', type: FLEET.GIT_REPO, metadata: { namespace: 'ns' }, nameDisplay: 'git-a', stateDisplay: 'Pending', stateSort: 'Pending'
      },
      {
        id: 'b', type: FLEET.GIT_REPO, metadata: { namespace: 'ns' }, nameDisplay: 'git-b', stateDisplay: 'Active', stateSort: 'Active'
      },
      {
        id: 'c', type: FLEET.GIT_REPO, metadata: { namespace: 'ns' }, nameDisplay: 'git-c', stateDisplay: 'Active', stateSort: 'Active'
      },
      {
        id: 'd', type: FLEET.HELM_OP, metadata: { namespace: 'ns' }, nameDisplay: 'helm-d', stateDisplay: 'Error', stateSort: 'Error'
      },
    ];

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    const result = wrapper.vm._resourceStates(resources);

    // Expect sorting by stateSort
    expect(result.map((s) => s.stateDisplay)).toStrictEqual(['Active', 'Error', 'Pending']);
    expect(result[0].resources).toHaveLength(2); // Active
    expect(result[1].resources).toHaveLength(1); // Error
    expect(result[2].resources).toHaveLength(1); // Pending
  });

  it('should _filterResources filters by type, state, and search filters', async() => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.setData({ typeFilter: { [workspaceId]: { [FLEET.GIT_REPO]: false, [FLEET.HELM_OP]: true } } });

    wrapper.vm.applicationStates[workspaceId] = [
      {
        stateDisplay: 'Active', statePanel: { id: 'active' }, resources: []
      },
      {
        stateDisplay: 'Modified', statePanel: { id: 'modified' }, resources: []
      },
      {
        stateDisplay: 'Error', statePanel: { id: 'error' }, resources: []
      }
    ];

    const activeState = {
      stateDisplay: 'Active',
      statePanel:   { id: 'active' },
      resources:    [
        {
          id: 'git-1', type: FLEET.GIT_REPO, namespace: workspaceId, nameDisplay: 'git-1', stateDisplay: 'Active', stateSort: 'Active'
        },
        {
          id: 'helm-1', type: FLEET.HELM_OP, namespace: workspaceId, nameDisplay: 'helm-1', stateDisplay: 'Active', stateSort: 'Active'
        },
      ]
    };
    const modifiedState = {
      stateDisplay: 'Modified',
      statePanel:   { id: 'modified' },
      resources:    [
        {
          id: 'git-2', type: FLEET.GIT_REPO, namespace: workspaceId, nameDisplay: 'git-2', stateDisplay: 'Modified', stateSort: 'Modified'
        },
      ]
    };

    let filtered = wrapper.vm._filterResources(activeState);

    expect(filtered).toHaveLength(1); // Only GitRepos

    // Test type filter
    (wrapper.vm.typeFilter as any)[workspaceId][FLEET.GIT_REPO] = false;
    (wrapper.vm.typeFilter as any)[workspaceId][FLEET.HELM_OP] = true;
    filtered = wrapper.vm._filterResources(activeState);
    expect(filtered).toHaveLength(1); // Only helm-1

    // Test state filter
    (wrapper.vm.typeFilter as any)[workspaceId][FLEET.GIT_REPO] = true;
    (wrapper.vm.typeFilter as any)[workspaceId][FLEET.HELM_OP] = true;
    (wrapper.vm.stateFilter as any)[workspaceId] = { active: true }; // Only show 'Active'
    filtered = wrapper.vm._filterResources(modifiedState);
    expect(filtered).toHaveLength(0);

    // Test search filter
    (wrapper.vm.stateFilter as any)[workspaceId] = {}; // Clear state filter
    (wrapper.vm.searchFilter as any)[workspaceId] = 'git-1';
    filtered = wrapper.vm._filterResources(activeState);
    expect(filtered).toHaveLength(1); // Only git-1
    expect(filtered[0].id).toBe('git-1');
  });

  it('should _groupByWorkspace correctly group resources by workspace ID', () => {
    const workspaces = [
      {
        id: 'test-ws1', data: 'foo', repos: [], helmOps: []
      },
      {
        id: 'test-ws2', data: 'bar', repos: [], helmOps: []
      }
    ];

    const wrapper = mount(Dashboard, { ...requiredSetup({ workspaces: () => workspaces }) });

    const callback = (ws: any) => ws.data.toUpperCase();
    const result = wrapper.vm._groupByWorkspace(callback);

    expect(result).toStrictEqual({
      'test-ws1': 'FOO',
      'test-ws2': 'BAR'
    });
  });

  it('should _stateExistsInWorkspace correctly identify if a state exists in a workspace', () => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.vm.applicationStates[workspaceId] = [
      { stateDisplay: 'Active', statePanel: { id: 'active' } },
      { stateDisplay: 'Modified', statePanel: { id: 'modified' } }
    ];

    expect(wrapper.vm._stateExistsInWorkspace(workspaceId, 'active')).toBe(true);
    expect(wrapper.vm._stateExistsInWorkspace(workspaceId, 'non-existent')).toBe(false);
  });

  it('should _decodeStateFilter correctly filter based on stateFilter', () => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.vm.applicationStates[workspaceId] = [
      { stateDisplay: 'Active', statePanel: { id: 'active' } },
      { stateDisplay: 'Modified', statePanel: { id: 'modified' } }
    ];

    (wrapper.vm.stateFilter as any)[workspaceId] = {};
    expect(wrapper.vm._decodeStateFilter(workspaceId, { statePanel: { id: 'active' } })).toBe(true);

    (wrapper.vm.stateFilter as any)[workspaceId] = { active: true };
    expect(wrapper.vm._decodeStateFilter(workspaceId, { statePanel: { id: 'active' } })).toBe(true);
    expect(wrapper.vm._decodeStateFilter(workspaceId, { statePanel: { id: 'modified' } })).toBe(false);

    (wrapper.vm.stateFilter as any)[workspaceId] = { nonExistent: true };
    expect(wrapper.vm._decodeStateFilter(workspaceId, { statePanel: { id: 'active' } })).toBe(true);
  });

  it('should _decodeTypeFilter correctly filter based on typeFilter', () => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.vm.typeFilter = {};
    expect(wrapper.vm._decodeTypeFilter(workspaceId, FLEET.GIT_REPO)).toBe(true);

    (wrapper.vm.typeFilter as any)[workspaceId] = { [FLEET.GIT_REPO]: true };
    expect(wrapper.vm._decodeTypeFilter(workspaceId, FLEET.GIT_REPO)).toBe(true);

    expect(wrapper.vm._decodeTypeFilter(workspaceId, FLEET.HELM_OP)).toBe(false);
  });

  it('should _decodeSearchFilter correctly filter based on searchFilter', () => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    // No search filter set (returns true)
    wrapper.vm.searchFilter = {};
    expect(wrapper.vm._decodeSearchFilter(workspaceId, 'my-app')).toBe(true);

    // Search filter set, name matches (returns true)
    (wrapper.vm.searchFilter as any)[workspaceId] = 'my';
    expect(wrapper.vm._decodeSearchFilter(workspaceId, 'my-app')).toBe(true);

    // Search filter set, name does not match (returns false)
    expect(wrapper.vm._decodeSearchFilter(workspaceId, 'other-app')).toBe(false);

    // View mode is not CARDS (returns true)
    wrapper.vm.viewMode = 'flat';
    expect(wrapper.vm._decodeSearchFilter(workspaceId, 'my-app')).toBe(true);
  });

  it('should _cleanStateFilter remove non-existent states from stateFilter', () => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, { ...requiredSetup() });

    wrapper.vm.applicationStates[workspaceId] = [
      { stateDisplay: 'Active', statePanel: { id: 'active' } },
    ];
    (wrapper.vm.stateFilter as any)[workspaceId] = {
      active:      true,
      nonExistent: true
    };

    wrapper.vm._cleanStateFilter(workspaceId);

    expect((wrapper.vm.stateFilter as any)[workspaceId]).toStrictEqual({ active: true });
  });

  it('should toggle workspace card collapse state when expand button is clicked', async() => {
    const workspaceId = 'fleet-local';

    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        {
          [FLEET.GIT_REPO]:     gitRepos,
          [FLEET.HELM_OP]:      helmOps,
          isWorkspaceCollapsed: {
            'fleet-local':   false,
            'fleet-default': true
          },
          isStateCollapsed: {
            'fleet-local': {
              Active: true, Modified: true, Error: true
            },
            'fleet-default': { Active: true }
          },
          typeFilter: {
            'fleet-local': {
              [FLEET.GIT_REPO]: true,
              [FLEET.HELM_OP]:  true,
            },
          },
          stateFilter:  {},
          searchFilter: {},
        }
      ),
      stubs: ['Loading', 'NoWorkspaces', 'EmptyDashboard', 'RouterLinkStub'],
    });

    const expandButton = wrapper.find(`[data-testid="workspace-expand-btn-${ workspaceId }"]`);

    await expandButton.trigger('click');
    expect((wrapper.vm.isWorkspaceCollapsed as any)[workspaceId]).toBe(true);

    await expandButton.trigger('click');
    expect((wrapper.vm.isWorkspaceCollapsed as any)[workspaceId]).toBe(false);
  });

  it('should toggle all workspace cards collapse state when "Expand All" / "Collapse All" is clicked', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        {
          [FLEET.GIT_REPO]:     gitRepos,
          [FLEET.HELM_OP]:      helmOps,
          isWorkspaceCollapsed: {
            'fleet-local':   false,
            'fleet-default': true
          },
          isStateCollapsed: {
            'fleet-local': {
              Active: true, Modified: true, Error: true
            },
            'fleet-default': { Active: true }
          },
          typeFilter: {
            'fleet-local': {
              [FLEET.GIT_REPO]: true,
              [FLEET.HELM_OP]:  true,
            },
          },
          stateFilter:  {},
          searchFilter: {},
        }
      ),
      stubs: ['Loading', 'NoWorkspaces', 'EmptyDashboard', 'RouterLinkStub'],
    });

    const ws1 = fleetWorkspaces[0].id;
    const ws2 = fleetWorkspaces[1].id;

    (wrapper.vm.isWorkspaceCollapsed as any)[ws1] = true;
    (wrapper.vm.isWorkspaceCollapsed as any)[ws2] = true;
    await wrapper.vm.$nextTick();

    const expandAllButton = wrapper.find('[data-testid="fleet-dashboard-expand-all"]');

    // Click to Expand All
    expect(wrapper.vm.allCardsExpanded).toBe(false);

    await expandAllButton.trigger('click');
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws1]).toBe(false);
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws2]).toBe(false);
    expect(wrapper.vm.allCardsExpanded).toBe(true);

    // Click to Collapse All
    await expandAllButton.trigger('click');
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws1]).toBe(true);
    expect((wrapper.vm.isWorkspaceCollapsed as any)[ws2]).toBe(true);
    expect(wrapper.vm.allCardsExpanded).toBe(false);
  });

  it('should update view mode when ButtonGroup value changes', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        { [FLEET.GIT_REPO]: gitRepos }
      ),
      stubs: ['Loading', 'NoWorkspaces', 'EmptyDashboard', 'RouterLinkStub'],
    });

    const buttonGroup = wrapper.findComponent({ name: 'ButtonGroup' });

    expect(wrapper.vm.viewMode).toBe('flat');

    await buttonGroup.vm.$emit('update:value', 'cards');
    expect(wrapper.vm.viewMode).toBe('cards');
  });

  it('should search filter be visible only if viewMode is cards', async() => {
    const wrapper = mount(Dashboard, {
      ...requiredSetup(
        { workspaces: () => fleetWorkspaces },
        { [FLEET.GIT_REPO]: gitRepos }
      ),
      stubs: ['Loading', 'NoWorkspaces', 'EmptyDashboard', 'RouterLinkStub'],
    });

    wrapper.vm.viewMode = 'cards';
    await wrapper.vm.$nextTick();

    const searchInput = wrapper.find('[data-testid="fleet-dashboard-search-input-fleet-local"]');

    expect(searchInput.exists()).toBe(true);
  });
});
