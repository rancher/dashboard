import TopLevelMenu from '@shell/components/nav/TopLevelMenu.vue';
import ClusterSwitcher from '@shell/components/nav/ClusterSwitcher.vue';
import { mount, Wrapper } from '@vue/test-utils';
import { CAPI, COUNT, MANAGEMENT } from '@shell/config/types';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
import { defineComponent, nextTick } from 'vue';
import sideNavService from '@shell/components/nav/TopLevelMenu.helper';
import { isMac } from '@shell/utils/platform';

jest.mock('@shell/utils/pagination-wrapper', () => {
  return jest.fn().mockImplementation(() => {
    return {
      request:   jest.fn().mockResolvedValue({ data: [] }),
      onDestroy: jest.fn(),
    };
  });
});

/**
 * `clusters` doubles up as both mgmt and prov clusters (don't shoot the messenger)
 */
const generateStore = (clusters: any[], settings = [{}]) => {
  return {
    getters: {
      'management/byId':              jest.fn(),
      'management/getSavedCount':     () => undefined,
      'management/schemaFor':         () => ({}),
      'management/paginationEnabled': () => false,
      'i18n/t':                       jest.fn(),
      'features/get':                 jest.fn(),
      'prefs/theme':                  jest.fn(),
      defaultClusterId:               jest.fn(),
      clusterId:                      jest.fn(),
      'type-map/activeProducts':      [],
      'management/all':               (type: string) => {
        switch (type) {
        case CAPI.RANCHER_CLUSTER:
          return clusters;
        case MANAGEMENT.CLUSTER:
          return clusters;
        case COUNT:
          return [{ counts: { [MANAGEMENT.CLUSTER]: { summary: { count: clusters.length } } } }];
        case MANAGEMENT.SETTING:
          return settings;
        }
      },
      'prefs/get': (pref: string) => {
        // The shelf is DERIVED from this pref: PINNED = the ids of the pinned clusters, in array
        // order. `local` is the fixed top tile (its own slice), so it's never part of the pinned group.
        if (pref === PINNED_CLUSTERS) {
          return clusters.filter((c: any) => c.pinned && c.id !== 'local').map((c: any) => c.id);
        }
      },
    },
    dispatch: (action: string, args: any) => {
      if (action === 'management/findAll' && args.type === CAPI.RANCHER_CLUSTER) {
        return clusters;
      }
    }
  };
};

// The nav shelf shows ONLY local + PINNED + RECENT — the estate and the one search box
// moved into the switcher flyout, which is teleported and rendered on demand. So the nav's half of that
// contract is what it hands the `ClusterSwitcher`: assert on those props rather than on rows the nav no
// longer renders.
const switcherProp = (wrapper: any, prop: string) => wrapper.findComponent(ClusterSwitcher).props(prop);

const waitForIt = async() => {
  jest.advanceTimersByTime(1000); // Wait for debounced call to fetch updated cluster list
  await nextTick(); // Wait for changes to cluster list to trigger changes
};

describe('topLevelMenu', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    sideNavService.reset();
    sideNavService.initialized = false;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should display clusters', async() => {
    const clusters = [{
      name: 'whatever',
      id:   'an-id1',
      mgmt: { id: 'an-id1' },
    }];
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: { ...generateStore(clusters) },
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    expect(switcherProp(wrapper, 'all').map((c: any) => c.id)).toStrictEqual(['an-id1']);
  });

  it('should show local cluster always on top of the list of clusters (unpinned and ready clusters)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              {
                name:        'x32-cwf5-name',
                id:          'an-id1',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                canExplore:  true
              },
              {
                name:        'x33-cwf5-name',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                canExplore:  true
              },
              {
                name:        'x34-cwf5-name',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                canExplore:  true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'local' },
                nameDisplay: 'local',
                canExplore:  true,
                isLocal:     true,
              },
            ])
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    // `local` is no longer forced to the top of the combined cluster list — it has its
    // own fixed tile (`menu-cluster-local`) above the groups. The rest of the estate goes to the flyout's
    // ALL CLUSTERS directory, alphabetically.
    expect(wrapper.find('[data-testid="menu-cluster-local"] .cluster-name p').text()).toStrictEqual('local');
    expect(switcherProp(wrapper, 'all').map((c: any) => c.label)).toStrictEqual(['a-cluster', 'b-cluster', 'c-cluster']);
  });

  it('should show local cluster always on top of the list of clusters (unpinned and mix ready/unready clusters)', async() => {
    const clusters = [
      {
        name:        'x32-cwf5-name',
        id:          'an-id1',
        mgmt:        { id: 'an-id1' },
        nameDisplay: 'c-cluster',
        canExplore:  true
      },
      {
        name:        'x33-cwf5-name',
        id:          'an-id2',
        mgmt:        { id: 'an-id2' },
        nameDisplay: 'a-cluster',
        canExplore:  false
      },
      {
        name:        'x34-cwf5-name',
        id:          'an-id3',
        mgmt:        { id: 'an-id3' },
        nameDisplay: 'b-cluster',
        canExplore:  true
      },
      {
        name:        'local-name',
        id:          'local',
        mgmt:        { id: 'local' },
        nameDisplay: 'local',
        canExplore:  true,
        isLocal:     true,
      },
    ];

    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: { ...generateStore(clusters) }
        },
        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    // `local` sits in its own fixed tile above the groups. The ALL CLUSTERS directory is
    // sorted active (ready) first, then alphabetical — so the unready `a-cluster` sorts below the ready
    // `b-cluster` / `c-cluster` (matching legacy behavior).
    expect(wrapper.find('[data-testid="menu-cluster-local"] .cluster-name p').text()).toStrictEqual('local');
    expect(switcherProp(wrapper, 'all').map((c: any) => c.label)).toStrictEqual(['b-cluster', 'c-cluster', 'a-cluster']);
  });

  it('should show local cluster always on top of the list of clusters (pinned and ready clusters)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              {
                name:        'x32-cwf5-name',
                id:          'an-id1',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                canExplore:  true,
                pinned:      true
              },
              {
                name:        'x33-cwf5-name',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                canExplore:  true,
                pinned:      true
              },
              {
                name:        'x34-cwf5-name',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                canExplore:  true,
                pinned:      true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'local' },
                nameDisplay: 'local',
                canExplore:  true,
                pinned:      true
              },
            ])
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    // `local` is the fixed top tile (its own slice), not part of the pinned group. PINNED shows in PREF
    // order (the pinned-clusters array), so c/a/b (an-id1/2/3).
    expect(wrapper.find('[data-testid="menu-cluster-local"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-0"] .cluster-name p').text()).toStrictEqual('c-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-2"] .cluster-name p').text()).toStrictEqual('b-cluster');
  });

  it('should show local cluster always on top of the list of clusters (pinned and mix ready/unready clusters)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      data: () => {
        return { hasProvCluster: true, showPinClusters: true };
      },

      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              {
                name:        'x32-cwf5-name',
                id:          'an-id1',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                canExplore:  true,
                pinned:      true
              },
              {
                name:        'x33-cwf5-name',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                canExplore:  true,
                pinned:      true
              },
              {
                name:        'x34-cwf5-name',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                canExplore:  false,
                pinned:      true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'local' },
                nameDisplay: 'local',
                canExplore:  true,
                pinned:      true
              },
            ])
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    // `local` is the fixed top tile (its own slice). PINNED shows in PREF order regardless of ready state,
    // so c/a/b (an-id1/2/3) — b-cluster is not-ready but keeps its pref position.
    expect(wrapper.find('[data-testid="menu-cluster-local"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-0"] .cluster-name p').text()).toStrictEqual('c-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-2"] .cluster-name p').text()).toStrictEqual('b-cluster');
  });

  // The cluster META — `providerDisplay · kubernetesVersion` — is a flyout-row detail now
  // (the nav shelf is a bare cluster name), so the coverage moves to the fields the nav resolves and hands
  // the flyout. providerDisplay resolves from the prov cluster's provisionerDisplay here; the four row
  // types (pinned/unpinned × ready/not-ready) are all still represented.
  it('should show meta (provider/k8s version) resolved from the prov cluster', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              // pinned ready cluster
              {
                name:                 'whatever',
                id:                   'an-id1',
                mgmt:                 { id: 'an-id1' },
                provisionerDisplay:   'provider-1',
                kubernetesVersionRaw: 'v1.31.1',
                nameDisplay:          'some-label',
                canExplore:           true,
                pinned:               true
              },
              // pinned NOT ready cluster
              {
                name:                 'whatever',
                id:                   'an-id2',
                mgmt:                 { id: 'an-id2' },
                provisionerDisplay:   'provider-2',
                kubernetesVersionRaw: 'v1.31.2',
                nameDisplay:          'some-label',
                pinned:               true
              },
              // unpinned ready cluster
              {
                name:                 'whatever',
                id:                   'an-id3',
                mgmt:                 { id: 'an-id3' },
                provisionerDisplay:   'provider-3',
                kubernetesVersionRaw: 'v1.31.3',
                nameDisplay:          'some-label',
                canExplore:           true
              },
              // unpinned NOT ready cluster
              {
                name:                 'whatever',
                id:                   'an-id4',
                mgmt:                 { id: 'an-id4' },
                provisionerDisplay:   'provider-4',
                kubernetesVersionRaw: 'v1.31.4',
                nameDisplay:          'some-label'
              },
            ])
          },
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    // The nav rows are a bare cluster name now — the provider · version meta line lives
    // only on the flyout rows, so check the fields the nav hands the flyout (ClusterSwitcherRow joins
    // them into that same "provider · version" string).
    expect(wrapper.find('[data-testid="pinned-menu-cluster-an-id1"] .description').exists()).toBe(false);

    const flyoutMeta = switcherProp(wrapper, 'all')
      .map((c: any) => `${ c.providerDisplay } · ${ c.kubernetesVersion }`);

    expect(flyoutMeta).toStrictEqual([
      'provider-1 · v1.31.1',
      'provider-3 · v1.31.3',
      'provider-2 · v1.31.2',
      'provider-4 · v1.31.4',
    ]);
  });

  // As above, but the provider falls back to the MGMT cluster's `provider` field (no prov provisionerDisplay)
  // — the RKE1/ember world. Verifies the provider resolution order still surfaces the meta.
  it('should show meta (provider/k8s version) resolved from the mgmt cluster (relevant for RKE1/ember world)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              // pinned ready cluster
              {
                name:                 'whatever',
                id:                   'an-id1',
                mgmt:                 { id: 'an-id1' },
                provider:             'provider-1',
                kubernetesVersionRaw: 'v1.31.1',
                nameDisplay:          'some-label',
                canExplore:           true,
                pinned:               true
              },
              // pinned NOT ready cluster
              {
                name:                 'whatever',
                id:                   'an-id2',
                mgmt:                 { id: 'an-id2' },
                provider:             'provider-2',
                kubernetesVersionRaw: 'v1.31.2',
                nameDisplay:          'some-label',
                pinned:               true
              },
              // unpinned ready cluster
              {
                name:                 'whatever',
                id:                   'an-id3',
                mgmt:                 { id: 'an-id3' },
                provider:             'provider-3',
                kubernetesVersionRaw: 'v1.31.3',
                nameDisplay:          'some-label',
                canExplore:           true
              },
              // unpinned NOT ready cluster
              {
                name:                 'whatever',
                id:                   'an-id4',
                mgmt:                 { id: 'an-id4' },
                provider:             'provider-4',
                kubernetesVersionRaw: 'v1.31.4',
                nameDisplay:          'some-label'
              },
            ]),
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    // The nav rows are a bare cluster name now — the provider · version meta line lives
    // only on the flyout rows, so check the fields the nav hands the flyout (ClusterSwitcherRow joins
    // them into that same "provider · version" string).
    expect(wrapper.find('[data-testid="pinned-menu-cluster-an-id1"] .description').exists()).toBe(false);

    const flyoutMeta = switcherProp(wrapper, 'all')
      .map((c: any) => `${ c.providerDisplay } · ${ c.kubernetesVersion }`);

    expect(flyoutMeta).toStrictEqual([
      'provider-1 · v1.31.1',
      'provider-3 · v1.31.3',
      'provider-2 · v1.31.2',
      'provider-4 · v1.31.4',
    ]);
  });

  describe('searching a term', () => {
    describe('should displays a no results message if have clusters but', () => {
      it('given no matching clusters', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: {},
              $store: {
                ...generateStore([
                  {
                    id:          'an-id1',
                    mgmt:        { id: 'an-id1' },
                    nameDisplay: 'something else'
                  }
                ])
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        await wrapper.setData({ clusterFilter: 'whatever' });

        await waitForIt();

        // The "no clusters match" caption is the flyout's (see ClusterSwitcher) — the nav's job is to
        // hand it an empty match list.
        expect(switcherProp(wrapper, 'searchResults')).toStrictEqual([]);
      });

      it('given no matched pinned clusters', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: {},
              $store: {
                ...generateStore([
                  {
                    id:          'an-id1',
                    mgmt:        { id: 'an-id1' },
                    nameDisplay: 'something else',
                    pinned:      true
                  }
                ])
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        // Set the filter AFTER mount so the `search` watcher fires and re-filters the ALL slice — the
        // initial helper seed always runs with an empty term, so a data()-preset filter never narrows it.
        await wrapper.setData({ clusterFilter: 'whatever' });

        await waitForIt();

        expect(switcherProp(wrapper, 'searchResults')).toStrictEqual([]);
      });
    });

    describe('should not displays a no results message', () => {
      it('given matching clusters', async() => {
        const search = 'you found me';
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data: () => ({ clusterFilter: search }),

          global: {
            mocks: {
              $route: {},
              $store: {
                ...generateStore([
                  {
                    id:          'an-id1',
                    mgmt:        { id: 'an-id1' },
                    nameDisplay: search
                  }
                ])
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        await waitForIt();

        expect(wrapper.vm.clustersFiltered).toHaveLength(1);
        expect(switcherProp(wrapper, 'searchResults')).toHaveLength(1);
      });

      it('given clusters with status pinned', async() => {
        const search = 'you found me';
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: {},
              $store: {
                ...generateStore([
                  {
                    nameDisplay: search,
                    pinned:      true,
                    id:          'an-id1',
                    mgmt:        { id: 'an-id1' },
                  }
                ])
              },
            },

            stubs: ['BrandImage', 'router-link'],
          },
        });

        await wrapper.setData({ clusterFilter: search });

        await waitForIt();

        expect(wrapper.vm.pinFiltered).toHaveLength(1);
      });
    });
  });

  // The nav's only estate affordance is the switcher trigger — a count chip ("N" over
  // the word "clusters") plus the "Cluster Switch" label and a trailing chevron. No search box, no ALL
  // CLUSTERS list and no CLUSTERS title live in the nav any more.
  describe('the cluster-switcher trigger', () => {
    const mountWithClusters = () => mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              {
                id: 'an-id1', mgmt: { id: 'an-id1' }, nameDisplay: 'a-cluster', canExplore: true
              },
              {
                id: 'local', mgmt: { id: 'local' }, nameDisplay: 'local', canExplore: true, isLocal: true
              },
            ])
          },
        },
        stubs: ['BrandImage', 'router-link'],
      },
    });

    it('shows the estate count over the word it counts, with the label and the chevron', async() => {
      const wrapper = mountWithClusters();

      await waitForIt();

      const trigger = wrapper.find('[data-testid="cluster-switcher-trigger"]');

      expect(trigger.exists()).toBe(true);
      expect(trigger.find('.cluster-all-count').text()).toStrictEqual('1');
      expect(trigger.find('.cluster-all-unit').exists()).toBe(true);
      expect(trigger.find('.cluster-all-name').exists()).toBe(true);
      // The chevron trails the label — it is NOT inside the count chip any more.
      expect(trigger.find('.cluster-all-badge .cluster-all-chevron').exists()).toBe(false);
      expect(trigger.find('.cluster-all-chevron').exists()).toBe(true);
    });

    it('leaves no search box, ALL CLUSTERS list or CLUSTERS title behind in the nav', async() => {
      const wrapper = mountWithClusters();

      await waitForIt();

      expect(wrapper.find('.clusters-search').exists()).toBe(false);
      expect(wrapper.find('.clustersList').exists()).toBe(false);
      expect(wrapper.find('[data-testid="top-level-menu-no-results"]').exists()).toBe(false);
    });

    it('drops the flyout search when the flyout closes, so the next open starts on the full estate', async() => {
      const wrapper = mountWithClusters();

      await waitForIt();
      await wrapper.setData({ clusterFilter: 'prod' });

      wrapper.vm.onFlyoutOpen(false);

      expect(wrapper.vm.clusterFilter).toStrictEqual('');
    });
  });

  // Resizing the nav re-anchors the flyout, so an open flyout has to be gone BEFORE the nav moves —
  // otherwise it jumps to the other position at full opacity and only then fades out.
  describe('expanding/collapsing the nav with the flyout open', () => {
    // A stand-in for the real switcher that exposes a `closeAndWait` we control, so the test can hold the
    // flyout "on screen" and watch what the nav does meanwhile.
    const switcherStub = (closeAndWait: () => Promise<void>) => defineComponent({
      name:     'ClusterSwitcher',
      template: '<div />',
      setup(_props, { expose }) {
        expose({ closeAndWait });

        return {};
      },
    });

    // One browsable cluster, so the trigger (and therefore the `switcher` ref) actually renders.
    const mountNav = (closeAndWait: () => Promise<void>) => mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([{
              id: 'an-id1', mgmt: { id: 'an-id1' }, nameDisplay: 'a-cluster'
            }])
          },
        },
        stubs: {
          BrandImage: true, 'router-link': true, ClusterSwitcher: switcherStub(closeAndWait)
        },
      },
    });

    it('waits for the flyout to leave before resizing the nav', async() => {
      let release: () => void = () => {};
      const gone = new Promise<void>((resolve) => {
        release = resolve;
      });
      const closeAndWait = jest.fn(() => gone);
      const wrapper = mountNav(closeAndWait);
      const vm = wrapper.vm as any;

      await waitForIt();

      const toggling = vm.toggle();

      await nextTick();
      // Still collapsed: the flyout is on its way out, and the nav must not move until it has gone.
      expect(closeAndWait).toHaveBeenCalledWith();
      expect(vm.shown).toBe(false);

      release();
      await toggling;

      expect(vm.shown).toBe(true);
    });

    it('does not stall when the flyout is already closed', async() => {
      const wrapper = mountNav(() => Promise.resolve());
      const vm = wrapper.vm as any;

      await waitForIt();
      await vm.toggle();

      expect(vm.shown).toBe(true);
    });
  });

  // The Cmd/Ctrl+J hint on the switcher trigger. It is anchored to a different element per nav state so
  // it never covers what it describes, so each state must light exactly one of the two up.
  describe('the switcher shortcut tooltip', () => {
    const mountNav = () => {
      const store: any = generateStore([]);

      store.getters['i18n/t'] = jest.fn((key: string, args: any) => `${ key }:${ JSON.stringify(args) }`);

      return mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: store,
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });
    };

    it('shows beside the chip on the collapsed rail, and only there', () => {
      const vm = mountNav().vm as any;

      expect(vm.shown).toBe(false);
      expect(vm.switcherTooltip(true).content).toContain('nav.switcher.shortcutTooltip');
      expect(vm.switcherTooltip(true).placement).toStrictEqual('right');
      // The row-anchored one would sit 300px out, detached from the rail.
      expect(vm.switcherTooltip().content).toBeNull();
    });

    it('shows off the end of the row when the nav is expanded, and only there', async() => {
      const wrapper = mountNav();
      const vm = wrapper.vm as any;

      await wrapper.setData({ shown: true });

      expect(vm.switcherTooltip().content).toContain('nav.switcher.shortcutTooltip');
      expect(vm.switcherTooltip().placement).toStrictEqual('right');
      // The chip-anchored one would land on top of the "Cluster Switch" label.
      expect(vm.switcherTooltip(true).content).toBeNull();
    });


    it.each([[true], [false]])('stays hidden while the flyout is open (showWhenClosed: %s)', async(showWhenClosed) => {
      const wrapper = mountNav();
      const vm = wrapper.vm as any;

      await wrapper.setData({ switcherOpen: true });

      expect(vm.switcherTooltip(showWhenClosed).content).toBeNull();
    });

    // The Mac glyph vs the Windows/Linux spelling — plus the spelled-out form for assistive tech, since
    // the glyph does not read out sensibly.
    it('renders the shortcut for the current platform', () => {
      const vm = mountNav().vm as any;

      expect(vm.switcherShortcutLabel).toStrictEqual(isMac ? '\u2318J' : 'Ctrl+J');
      expect(vm.switcherKeyShortcut).toStrictEqual(isMac ? 'Meta+J' : 'Control+J');
    });
  });

  // While the flyout is open it owns the keyboard: every other app shortcut behind it is swallowed.
  describe('the open flyout blocks other shortcuts', () => {
    const guardEvent = (over: any = {}) => ({
      key:                      'k',
      code:                     'KeyK',
      metaKey:                  false,
      ctrlKey:                  false,
      altKey:                   false,
      shiftKey:                 false,
      target:                   { closest: () => null },
      stopPropagation:          jest.fn(),
      stopImmediatePropagation: jest.fn(),
      ...over,
    });

    const guard = (event: any, switcherOpen = true, route: any = {}) => {
      const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: route,
            $store: { ...generateStore([]) },
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      wrapper.vm.switcherOpen = switcherOpen;
      wrapper.vm.onSwitcherKeyGuard(event);

      return { event, vm: wrapper.vm };
    };

    // A cluster-explorer route — the only place the "keep this view" combo means anything.
    const explorerRoute = { name: 'c-cluster-explorer', params: { product: 'explorer' } };

    it('swallows an unrelated app shortcut (Cmd+K)', () => {
      const { event } = guard(guardEvent({ metaKey: true }));

      expect(event.stopImmediatePropagation).toHaveBeenCalledWith();
      expect(event.stopPropagation).toHaveBeenCalledWith();
    });

    it('lets Cmd/Ctrl+J through so the flyout can be closed with the same shortcut that opened it', () => {
      const { event } = guard(guardEvent({
        key: 'j', code: 'KeyJ', metaKey: true
      }));

      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });

    // Option/Alt has to reach the `v-shortkey.hold` bindings, which own the "keep this view" reveal and
    // its release when focus leaves the page (issue 11329) — see the routeCombo tests below.
    it.each([['keydown'], ['keyup']])('lets Option/Alt through so the hold reveal keeps working (%s)', (type) => {
      const { event } = guard(guardEvent({
        key: 'Alt', code: 'AltLeft', altKey: type === 'keydown', type
      }), true, explorerRoute);

      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });

    it('leaves keys typed inside the flyout alone (search, ↑↓, Enter, Esc)', () => {
      // A node inside the flyout is inside the popper root too — both selectors match.
      const inFlyout = { closest: (sel: string) => (sel === '.cluster-switcher-flyout' || sel === '.cluster-switcher-popper' ? {} : null) };
      const { event } = guard(guardEvent({ target: inFlyout }));

      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });

    // Clicking the flyout's own chrome parks focus on floating-vue's popper root, which is OUTSIDE the
    // flyout. Swallowing keys there would take Esc with them and leave the user trapped.
    it('leaves keys alone when focus sits on the popper root outside the flyout', () => {
      const onPopperRoot = { closest: (sel: string) => (sel === '.cluster-switcher-popper' ? {} : null) };
      const { event } = guard(guardEvent({ target: onPopperRoot }));

      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });

    it('does nothing at all while the flyout is closed', () => {
      const { event } = guard(guardEvent({ metaKey: true }), false);

      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    it('should initialize sideNavService', () => {
      const spyInit = jest.spyOn(sideNavService, 'init');

      mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: { ...generateStore([]) },
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      expect(spyInit).toHaveBeenCalled(); // eslint-disable-line jest/prefer-called-with
    });

    it('should call helper.update if pagination is disabled', () => {
      const store = generateStore([]);

      store.getters['management/paginationEnabled'] = () => false;

      jest.spyOn(sideNavService, 'init').mockImplementation(() => {});
      const updateSpy = jest.fn();
      const mockHelper = {
        update:         updateSpy,
        clustersPinned: [],
        clustersOthers: [],
        clustersRecent: [],
        clustersLocal:  [],
        counts:         { others: 0 },
        updateCount:    () => {}
      };

      jest.spyOn(sideNavService, 'helper', 'get').mockReturnValue(mockHelper as any);

      mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: store,
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      // data() seeds the helper with the watched context set — pinned + recent + search
      // term — dropping the legacy `unPinnedMax` (the ALL list is now a separate page-increment slice).
      // `recentIds` reads the RECENT_CLUSTERS pref, which this mock leaves unset (undefined).
      expect(updateSpy).toHaveBeenCalledWith({
        pinnedIds: [], recentIds: undefined, searchTerm: ''
      });
    });

    it('should call helper.update if pagination is enabled but service not initialized', () => {
      const store = generateStore([]);

      store.getters['management/paginationEnabled'] = () => true;
      sideNavService.initialized = false;

      jest.spyOn(sideNavService, 'init').mockImplementation(() => {});
      const updateSpy = jest.fn();
      const mockHelper = {
        update:         updateSpy,
        clustersPinned: [],
        clustersOthers: [],
        clustersRecent: [],
        clustersLocal:  [],
        counts:         { others: 0 },
        updateCount:    () => {}
      };

      jest.spyOn(sideNavService, 'helper', 'get').mockReturnValue(mockHelper as any);

      mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: store,
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      // data() seeds the helper with the watched context set — pinned + recent + search
      // term — dropping the legacy `unPinnedMax` (the ALL list is now a separate page-increment slice).
      // `recentIds` reads the RECENT_CLUSTERS pref, which this mock leaves unset (undefined).
      expect(updateSpy).toHaveBeenCalledWith({
        pinnedIds: [], recentIds: undefined, searchTerm: ''
      });
    });

    it('should NOT call helper.update if pagination is enabled and service initialized', () => {
      const store = generateStore([]);

      store.getters['management/paginationEnabled'] = () => true;
      sideNavService.initialized = true;

      jest.spyOn(sideNavService, 'init').mockImplementation(() => {});
      const updateSpy = jest.fn();
      const mockHelper = {
        update:         updateSpy,
        clustersPinned: [],
        clustersOthers: [],
        clustersRecent: [],
        clustersLocal:  [],
        counts:         { others: 0 },
        updateCount:    () => {}
      };

      jest.spyOn(sideNavService, 'helper', 'get').mockReturnValue(mockHelper as any);

      mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: store,
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should populate clusters from store if pagination is disabled', () => {
      const clusters = [{ id: 'c1' }];
      const store = generateStore(clusters);

      store.getters['management/paginationEnabled'] = () => false;
      store.getters['management/schemaFor'] = () => true;

      const wrapper = mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: store,
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      expect(wrapper.vm.provClusters).toStrictEqual(clusters);
      expect(wrapper.vm.mgmtClusters).toStrictEqual(clusters);
    });

    it('should NOT populate clusters from store if pagination is enabled', () => {
      const clusters = [{ id: 'c1' }];
      const store = generateStore(clusters);

      store.getters['management/paginationEnabled'] = () => true;
      store.getters['management/schemaFor'] = () => true;

      const wrapper = mount(TopLevelMenu, {
        global: {
          mocks: {
            $route: {},
            $store: store,
          },
          stubs: ['BrandImage', 'router-link'],
        },
      });

      expect(wrapper.vm.provClusters).toStrictEqual([]);
      expect(wrapper.vm.mgmtClusters).toStrictEqual([]);
    });
  });

  describe('computed properties', () => {
    describe('routeComboActive', () => {
      it('should be true when routeCombo is true and there are multiple ready clusters', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: { name: 'c-cluster-explorer', params: { cluster: 'local', product: 'explorer' } },
              $store: {
                ...generateStore([
                  {
                    nameDisplay: 'cluster1',
                    id:          'an-id1',
                    mgmt:        { id: 'an-id1' },
                    canExplore:  true
                  },
                  {
                    nameDisplay: 'cluster2',
                    id:          'an-id2',
                    mgmt:        { id: 'an-id2' },
                    canExplore:  true
                  }
                ])
              }
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();
        await wrapper.setData({ routeCombo: true });

        expect(wrapper.vm.routeComboActive).toBe(true);
      });

      it('should be false when routeCombo is false', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: {},
              $store: {
                ...generateStore([
                  {
                    nameDisplay: 'cluster1',
                    id:          'an-id1',
                    mgmt:        { id: 'an-id1' },
                    canExplore:  true
                  },
                  {
                    nameDisplay: 'cluster2',
                    id:          'an-id2',
                    mgmt:        { id: 'an-id2' },
                    canExplore:  true
                  }
                ])
              }
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();
        await wrapper.setData({ routeCombo: false });

        expect(wrapper.vm.routeComboActive).toBe(false);
      });

      it('should be false when there is only one ready cluster and it is the current cluster', async() => {
        const store = generateStore([
          {
            nameDisplay: 'cluster1',
            id:          'an-id1',
            mgmt:        { id: 'an-id1' },
            canExplore:  true
          }
        ]);

        store.getters.clusterId = 'an-id1' as any;

        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: {},
              $store: store
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();
        await wrapper.setData({ routeCombo: true });

        expect(wrapper.vm.routeComboActive).toBe(false);
      });

      it('should be true when there is only one ready cluster but it is not the current cluster', async() => {
        const store = generateStore([
          {
            nameDisplay: 'cluster1',
            id:          'an-id1',
            mgmt:        { id: 'an-id1' },
            canExplore:  true
          }
        ]);

        store.getters.clusterId = 'some-other-cluster-id' as any;

        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route: { name: 'c-cluster-explorer', params: { cluster: 'local', product: 'explorer' } },
              $store: store
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();
        await wrapper.setData({ routeCombo: true });

        expect(wrapper.vm.routeComboActive).toBe(true);
      });
    });

    // Alt/Option "keep context" reveal (issue 11329): routeCombo tracks the raw modifier with ABSOLUTE
    // sets (keydown -> true, keyup -> false) and is forced off on any focus/visibility loss, so a missed
    // key edge can never leave it stuck on or invert its next press.
    // Alt/Option "keep context" reveal (issue 11329): routeCombo mirrors the ABSOLUTE state reported by
    // the `v-hold-key` directive via its `holdkey` event (held on keydown, cleared on keyup / focus loss),
    // so it can never desync or invert the way the old `v-shortkey.push` toggle did. The keydown/keyup/
    // focus-loss detection itself is covered by the hold-key plugin's own tests.
    describe('routeCombo (Alt/Option reveal)', () => {
      const mountMenu = () => mount(TopLevelMenu, {
        global: {
          mocks: {
            $route:  { name: 'c-cluster-explorer', params: { cluster: 'local', product: 'explorer' } },
            $router: { push: jest.fn() },
            $store:  { ...generateStore([]) }
          },
          stubs: ['BrandImage', 'router-link'],
        }
      }) as Wrapper<InstanceType<typeof TopLevelMenu>>;

      it('mirrors the holdkey event detail onto routeCombo, absolutely (never toggles)', async() => {
        const wrapper = mountMenu();

        await waitForIt();

        expect(wrapper.vm.routeCombo).toBe(false);

        wrapper.vm.onRouteComboHold({ detail: { held: true } } as CustomEvent);
        expect(wrapper.vm.routeCombo).toBe(true);

        // A repeated held:true event keeps it on rather than flipping it off (the old toggle bug).
        wrapper.vm.onRouteComboHold({ detail: { held: true } } as CustomEvent);
        expect(wrapper.vm.routeCombo).toBe(true);

        wrapper.vm.onRouteComboHold({ detail: { held: false } } as CustomEvent);
        expect(wrapper.vm.routeCombo).toBe(false);

        // A stray held:false (e.g. the directive's focus-loss release) can't invert it back on.
        wrapper.vm.onRouteComboHold({ detail: { held: false } } as CustomEvent);
        expect(wrapper.vm.routeCombo).toBe(false);
      });
    });

    describe('toggle button a11y attributes', () => {
      const mountToggleButton = (shownState = false) => {
        return mount(TopLevelMenu, {
          data:   () => ({ shown: shownState }),
          global: {
            mocks: {
              $route: {},
              $store: { ...generateStore([]) },
            },
            stubs: ['BrandImage', 'router-link'],
          },
        });
      };

      it('should use "expandAppBar" translation key as aria-label when menu is collapsed', () => {
        const wrapper = mountToggleButton(false);

        expect(wrapper.find('[data-testid="top-level-menu"]').attributes('aria-label')).toStrictEqual('%nav.expandAppBar%');
      });

      it('should use "collapseAppBar" translation key as aria-label when menu is expanded', () => {
        const wrapper = mountToggleButton(true);

        expect(wrapper.find('[data-testid="top-level-menu"]').attributes('aria-label')).toStrictEqual('%nav.collapseAppBar%');
      });

      it('should update aria-label reactively when shown state changes', async() => {
        const wrapper = mountToggleButton(false);
        const button = wrapper.find('[data-testid="top-level-menu"]');

        expect(button.attributes('aria-label')).toStrictEqual('%nav.expandAppBar%');

        await wrapper.setData({ shown: true });

        expect(button.attributes('aria-label')).toStrictEqual('%nav.collapseAppBar%');
      });

      it('should expose aria-expanded false and point aria-controls at the menu body when collapsed', () => {
        const wrapper = mountToggleButton(false);
        const button = wrapper.find('[data-testid="top-level-menu"]');

        expect(button.attributes('aria-expanded')).toStrictEqual('false');
        expect(button.attributes('aria-controls')).toStrictEqual('top-level-menu-body');
        expect(wrapper.find('#top-level-menu-body').exists()).toBe(true);
      });

      it('should expose aria-expanded true when the menu is expanded', () => {
        const wrapper = mountToggleButton(true);

        expect(wrapper.find('[data-testid="top-level-menu"]').attributes('aria-expanded')).toStrictEqual('true');
      });

      it('should update aria-expanded reactively when shown state changes', async() => {
        const wrapper = mountToggleButton(false);
        const button = wrapper.find('[data-testid="top-level-menu"]');

        expect(button.attributes('aria-expanded')).toStrictEqual('false');

        await wrapper.setData({ shown: true });

        expect(button.attributes('aria-expanded')).toStrictEqual('true');
      });
    });

    describe('clusterMenuClick', () => {
      it('should navigate normally on non-explorer c-cluster route even with routeCombo set', async() => {
        const mockPush = jest.fn();
        const clusterRoute = { name: 'c-cluster-explorer' };
        const clusters = [
          {
            nameDisplay: 'cluster1',
            id:          'an-id1',
            mgmt:        { id: 'an-id1' },
            canExplore:  true,
            clusterRoute
          },
          {
            nameDisplay: 'cluster2',
            id:          'an-id2',
            mgmt:        { id: 'an-id2' },
            canExplore:  true,
            clusterRoute
          }
        ];

        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route:  { name: 'c-cluster-fleet', params: { cluster: 'local', product: 'fleet' } },
              $router: { push: mockPush },
              $store:  { ...generateStore(clusters) }
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();
        await wrapper.setData({ routeCombo: true });

        expect(wrapper.vm.routeComboActive).toBe(false);

        const ev = { preventDefault: jest.fn() };

        wrapper.vm.clusterMenuClick(ev, clusters[1]);

        expect(mockPush).toHaveBeenCalledWith(clusterRoute);
      });

      it('should navigate to cluster route when routeComboActive is false', async() => {
        const mockPush = jest.fn();
        const clusterRoute = { name: 'c-cluster-explorer' };
        const clusters = [
          {
            nameDisplay: 'cluster1',
            id:          'an-id1',
            mgmt:        { id: 'an-id1' },
            canExplore:  true,
            clusterRoute
          }
        ];

        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route:  { name: 'fleet-management', params: {} },
              $router: { push: mockPush },
              $store:  { ...generateStore(clusters) }
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();

        const ev = { preventDefault: jest.fn() };

        wrapper.vm.clusterMenuClick(ev, clusters[0]);

        expect(mockPush).toHaveBeenCalledWith(clusterRoute);
      });
    });
  });
});
