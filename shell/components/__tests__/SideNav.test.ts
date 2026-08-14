import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SideNav from '@shell/components/SideNav.vue';

const navStateStorage = { load: jest.fn(), save: jest.fn() };

jest.mock('@shell/composables/useClusterLocalStorage', () => ({ useClusterLocalStorage: () => navStateStorage }));

const getters: Record<string, any> = {
  isStandaloneHarvester:      false,
  productId:                  'explorer',
  clusterId:                  'c-test',
  currentProduct:             { inStore: 'cluster' },
  rootProduct:                { name: 'explorer' },
  isSingleProduct:            false,
  namespaceMode:              'both',
  isExplorer:                 true,
  isVirtualCluster:           false,
  'i18n/selectedLocaleLabel': 'English',
  'i18n/hasMultipleLocales':  false,
  'type-map/activeProducts':  [],
  'prefs/get':                () => [],
  'cluster/schemaFor':        () => null,
  'cluster/all':              () => [],
  activeNamespaceCache:       [],
};

const mockStore = {
  // clusterReady false keeps `created()`'s getGroups from building a real tree,
  // so each test can drive the methods with a tree of its own.
  state:    { managementReady: true, clusterReady: false },
  getters:  new Proxy(getters, { get: (target, prop: string) => target[prop] }),
  dispatch: jest.fn(),
};

/**
 * Explorer-shaped nav tree: a root group (never collapsible), a flat group, and
 * two groups that each contain a nested group of the same name.
 */
const navTree = (): any[] => [
  {
    name:     'root',
    isRoot:   true,
    children: [{ name: 'cluster-dashboard', route: { name: 'dashboard' } }],
  },
  {
    name:     'workloads',
    children: [{ name: 'pod', route: { name: 'pod' } }],
  },
  {
    name:     'more',
    children: [
      { name: 'networking', children: [{ name: 'ingress', route: { name: 'ingress' } }] },
      { name: 'secret', route: { name: 'secret' } },
    ],
  },
  {
    name:     'istio',
    children: [{ name: 'networking', children: [{ name: 'gateway', route: { name: 'gateway' } }] }],
  },
];

// Stands in for Group, with the pieces SideNav's route sync calls into.
const GroupStub = {
  name:     'Group',
  props:    ['group', 'canCollapse', 'showHeader', 'idPrefix'],
  template: '<div class="group-stub" />',
  methods:  {
    hasActiveRoute: () => false,
    syncNav:        () => undefined,
  },
};

// `wrapper.vm.groups` resolves to the `ref="groups"` template refs, so go through
// `$data` to reach (and reactively mutate) the nav tree itself.
const navGroups = (wrapper: any, groups?: any[]) => {
  if (groups) {
    wrapper.vm.$data.groups = groups;
  }

  return wrapper.vm.$data.groups;
};

const mountNav = () => shallowMount(SideNav as any, {
  global: {
    provide: { store: mockStore },
    stubs:   { Group: GroupStub, 'router-link': true },
    mocks:   {
      $store: mockStore,
      $route: {
        params: {}, path: '/c/c-test/explorer', matched: []
      },
      $router: { resolve: jest.fn().mockReturnValue({ path: '/c/c-test/explorer' }), getRoutes: jest.fn().mockReturnValue([]) },
      t:       (key: string) => key,
    },
  },
});

describe('component: SideNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navStateStorage.load.mockReturnValue(null);
  });

  describe('persisted expand/collapse state', () => {
    it('stamps the saved state onto the tree as it is built, including nested groups', () => {
      navStateStorage.load.mockReturnValue({ workloads: true, more_networking: true });

      const groups = navTree();

      (mountNav().vm as any).stampNavState(groups);

      expect(groups[1].expanded).toBe(true);
      expect(groups[2].children[0].expanded).toBe(true);
    });

    it('keys the saved state by path, so groups sharing a name do not share state', () => {
      navStateStorage.load.mockReturnValue({ more_networking: true });

      const groups = navTree();

      (mountNav().vm as any).stampNavState(groups);

      // `More Resources > Networking` is expanded, `Istio > Networking` is not
      expect(groups[2].children[0].expanded).toBe(true);
      expect(groups[3].children[0].expanded).toBeUndefined();
    });

    it('saves every group at every level, keyed by path', () => {
      const wrapper = mountNav();
      const groups = navTree();

      groups[1].expanded = true;
      navGroups(wrapper, groups);

      (wrapper.vm as any).saveNavState();

      expect(navStateStorage.save).toHaveBeenCalledWith({
        workloads:        true,
        more:             false,
        more_networking:  false,
        istio:            false,
        istio_networking: false,
      });
    });

    it('keeps the saved state of a group nested inside a collapsed parent', () => {
      const wrapper = mountNav();
      const groups = navTree();

      // The nested group isn't rendered while its parent is collapsed, so its
      // state has to come from the tree rather than from the mounted groups
      groups[2].expanded = false;
      groups[2].children[0].expanded = true;
      navGroups(wrapper, groups);

      (wrapper.vm as any).saveNavState();

      expect(navStateStorage.save).toHaveBeenCalledWith(expect.objectContaining({ more: false, more_networking: true }));
    });

    it('keeps the saved state of a group that is not in the tree at all', () => {
      // `More Resources` subgroups are count driven, so narrowing the namespace
      // filter takes them out of the tree entirely
      navStateStorage.load.mockReturnValue({ more_gone: true });

      const wrapper = mountNav();

      navGroups(wrapper, navTree());

      (wrapper.vm as any).saveNavState();

      expect(navStateStorage.save).toHaveBeenCalledWith(expect.objectContaining({ more_gone: true, more: false }));
    });

    it('saves when a group is expanded or collapsed', async() => {
      const wrapper = mountNav();

      navGroups(wrapper, navTree());
      await nextTick();
      // The route sync that runs on mount saves too, so start from a clean slate
      navStateStorage.save.mockClear();

      const groups = wrapper.findAllComponents({ name: 'Group' });

      groups[0].vm.$emit('expand');
      expect(navStateStorage.save).toHaveBeenCalledTimes(1);

      groups[0].vm.$emit('close');
      expect(navStateStorage.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('collapse all', () => {
    it('closes every group at every level and clears the saved state', () => {
      // Anything stored for a group means it was left expanded, so collapse all
      // drops the state rather than merging into it
      navStateStorage.load.mockReturnValue({ more_gone: true });

      const wrapper = mountNav();
      const groups = navTree();

      groups[1].expanded = true;
      groups[2].expanded = true;
      groups[2].children[0].expanded = true;
      navGroups(wrapper, groups);

      (wrapper.vm as any).collapseAll();

      expect(groups[1].expanded).toBe(false);
      expect(groups[2].expanded).toBe(false);
      expect(groups[2].children[0].expanded).toBe(false);
      expect(navStateStorage.save).toHaveBeenCalledWith({});
    });

    it('offers the control while only a group nested inside a collapsed parent is expanded', () => {
      const wrapper = mountNav();
      const groups = navTree();

      navGroups(wrapper, groups);
      expect((wrapper.vm as any).hasExpandedGroup).toBe(false);

      navGroups(wrapper)[2].children[0].expanded = true;
      expect((wrapper.vm as any).hasExpandedGroup).toBe(true);
    });
  });

  describe('scrolling a jumped-to section into view', () => {
    it('scrolls the active item into view when a jump has settled', () => {
      const wrapper = mountNav();
      const scroll = jest.spyOn(wrapper.vm as any, 'scrollActiveIntoView').mockImplementation(() => undefined);

      (wrapper.vm as any).onJumped();

      expect(scroll).toHaveBeenCalledWith();
    });

    it('expands the target group when the jump did not change the route', () => {
      const wrapper = mountNav();
      const sync = jest.spyOn(wrapper.vm as any, 'syncNav').mockImplementation(() => undefined);

      jest.spyOn(wrapper.vm as any, 'scrollActiveIntoView').mockImplementation(() => undefined);

      // Jumping to the section already being shown resolves without a route
      // change, so the $route watcher never runs and only this can expand it.
      (wrapper.vm as any).onJumped();

      expect(sync).toHaveBeenCalledWith();
    });

    it('does not scroll on a navigation that was not a jump', async() => {
      const wrapper = mountNav();
      const scroll = jest.spyOn(wrapper.vm as any, 'scrollActiveIntoView').mockImplementation(() => undefined);

      // A tab or hash change on the page the user is already on must not yank a
      // nav they have scrolled back to the active item.
      (wrapper.vm as any).$options.watch.$route.call(wrapper.vm, {}, {});
      await nextTick();

      expect(scroll).not.toHaveBeenCalledWith();
    });
  });
});
