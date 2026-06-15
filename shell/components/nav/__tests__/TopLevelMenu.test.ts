import TopLevelMenu from '@shell/components/nav/TopLevelMenu.vue';
import { mount, Wrapper } from '@vue/test-utils';
import { CAPI, COUNT, MANAGEMENT } from '@shell/config/types';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
import { nextTick } from 'vue';
import sideNavService from '@shell/components/nav/TopLevelMenu.helper';

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
        if (pref === PINNED_CLUSTERS) {
          return [];
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

    const cluster = wrapper.find('[data-testid="top-level-menu-cluster-0"]');

    expect(cluster.exists()).toBe(true);
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
                canExplore:  true
              },
            ])
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    expect(wrapper.find('[data-testid="top-level-menu-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-2"] .cluster-name p').text()).toStrictEqual('b-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-3"] .cluster-name p').text()).toStrictEqual('c-cluster');
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

    expect(wrapper.find('[data-testid="top-level-menu-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-3"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-1"] .cluster-name p').text()).toStrictEqual('b-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-2"] .cluster-name p').text()).toStrictEqual('c-cluster');
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

    expect(wrapper.find('[data-testid="pinned-ready-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-2"] .cluster-name p').text()).toStrictEqual('b-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-3"] .cluster-name p').text()).toStrictEqual('c-cluster');
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

    expect(wrapper.find('[data-testid="pinned-ready-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-2"] .cluster-name p').text()).toStrictEqual('c-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-3"] .cluster-name p').text()).toStrictEqual('b-cluster');
  });

  it('should show description if it is available on the prov cluster', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              // pinned ready cluster
              {
                name:        'whatever',
                id:          'an-id1',
                mgmt:        { id: 'an-id1' },
                description: 'some-description1',
                nameDisplay: 'some-label',
                canExplore:  true,
                pinned:      true
              },
              // pinned NOT ready cluster
              {
                name:        'whatever',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                description: 'some-description2',
                nameDisplay: 'some-label',
                pinned:      true
              },
              // unpinned ready cluster
              {
                name:        'whatever',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                description: 'some-description3',
                nameDisplay: 'some-label',
                canExplore:  true
              },
              // unpinned NOT ready cluster
              {
                name:        'whatever',
                id:          'an-id4',
                mgmt:        { id: 'an-id4' },
                description: 'some-description4',
                nameDisplay: 'some-label'
              },
            ])
          },
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    const description1 = wrapper.find('[data-testid="pinned-menu-cluster-an-id1"] .description');
    const description2 = wrapper.find('[data-testid="pinned-menu-cluster-disabled-an-id2"] .description');
    const description3 = wrapper.find('[data-testid="menu-cluster-an-id3"] .description');
    const description4 = wrapper.find('[data-testid="menu-cluster-disabled-an-id4"] .description');

    expect(description1.text()).toStrictEqual('some-description1');
    expect(description2.text()).toStrictEqual('some-description2');
    expect(description3.text()).toStrictEqual('some-description3');
    expect(description4.text()).toStrictEqual('some-description4');
  });

  it('should show description if it is available on the mgmt cluster (relevant for RKE1/ember world)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore([
              // pinned ready cluster
              {
                name:        'whatever',
                id:          'an-id1',
                mgmt:        { id: 'an-id1' },
                description: 'some-description1',
                nameDisplay: 'some-label',
                canExplore:  true,
                pinned:      true
              },
              // pinned NOT ready cluster
              {
                name:        'whatever',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                description: 'some-description2',
                nameDisplay: 'some-label',
                pinned:      true
              },
              // unpinned ready cluster
              {
                name:        'whatever',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                description: 'some-description3',
                nameDisplay: 'some-label',
                canExplore:  true
              },
              // unpinned NOT ready cluster
              {
                name:        'whatever',
                id:          'an-id4',
                mgmt:        { id: 'an-id4' },
                description: 'some-description4',
                nameDisplay: 'some-label'
              },
            ]),
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    const description1 = wrapper.find('[data-testid="pinned-menu-cluster-an-id1"] .description');
    const description2 = wrapper.find('[data-testid="pinned-menu-cluster-disabled-an-id2"] .description');
    const description3 = wrapper.find('[data-testid="menu-cluster-an-id3"] .description');
    const description4 = wrapper.find('[data-testid="menu-cluster-disabled-an-id4"] .description');

    expect(description1.text()).toStrictEqual('some-description1');
    expect(description2.text()).toStrictEqual('some-description2');
    expect(description3.text()).toStrictEqual('some-description3');
    expect(description4.text()).toStrictEqual('some-description4');
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

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(noResults.exists()).toBe(true);
      });

      it('given no matched pinned clusters', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data: () => ({ clusterFilter: 'whatever' }),

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

        await waitForIt();

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(noResults.exists()).toBe(true);
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

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.clustersFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
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

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.pinFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });
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
        update: updateSpy, clustersPinned: [], clustersOthers: [], updateCount: () => {}
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

      expect(updateSpy).toHaveBeenCalledWith({
        pinnedIds: [], searchTerm: '', unPinnedMax: 10
      });
    });

    it('should call helper.update if pagination is enabled but service not initialized', () => {
      const store = generateStore([]);

      store.getters['management/paginationEnabled'] = () => true;
      sideNavService.initialized = false;

      jest.spyOn(sideNavService, 'init').mockImplementation(() => {});
      const updateSpy = jest.fn();
      const mockHelper = {
        update: updateSpy, clustersPinned: [], clustersOthers: [], updateCount: () => {}
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

      expect(updateSpy).toHaveBeenCalledWith({
        pinnedIds: [], searchTerm: '', unPinnedMax: 10
      });
    });

    it('should NOT call helper.update if pagination is enabled and service initialized', () => {
      const store = generateStore([]);

      store.getters['management/paginationEnabled'] = () => true;
      sideNavService.initialized = true;

      jest.spyOn(sideNavService, 'init').mockImplementation(() => {});
      const updateSpy = jest.fn();
      const mockHelper = {
        update: updateSpy, clustersPinned: [], clustersOthers: [], updateCount: () => {}
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

    describe('handleKeyComboClick', () => {
      it('should not toggle routeCombo when route is a non-explorer c-cluster route', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route:  { name: 'c-cluster-fleet', params: { cluster: 'local', product: 'fleet' } },
              $router: { push: jest.fn() },
              $store:  { ...generateStore([]) }
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();

        expect(wrapper.vm.routeCombo).toBe(false);
        wrapper.vm.handleKeyComboClick();
        expect(wrapper.vm.routeCombo).toBe(false);
      });

      it('should toggle routeCombo when route is cluster explorer', async() => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          global: {
            mocks: {
              $route:  { name: 'c-cluster-explorer', params: { cluster: 'local', product: 'explorer' } },
              $router: { push: jest.fn() },
              $store:  { ...generateStore([]) }
            },
            stubs: ['BrandImage', 'router-link'],
          }
        });

        await waitForIt();

        expect(wrapper.vm.routeCombo).toBe(false);
        wrapper.vm.handleKeyComboClick();
        expect(wrapper.vm.routeCombo).toBe(true);
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
