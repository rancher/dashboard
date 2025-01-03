import TopLevelMenu from '@shell/components/nav/TopLevelMenu.vue';
import { SETTING } from '@shell/config/settings';
import { mount, Wrapper } from '@vue/test-utils';
import { CAPI, COUNT, MANAGEMENT } from '@shell/config/types';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
import { nextTick } from 'vue';

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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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
                isReady:     true
              },
              {
                name:        'x33-cwf5-name',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     true
              },
              {
                name:        'x34-cwf5-name',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'local' },
                nameDisplay: 'local',
                isReady:     true
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
        isReady:     true
      },
      {
        name:        'x33-cwf5-name',
        id:          'an-id2',
        mgmt:        { id: 'an-id2' },
        nameDisplay: 'a-cluster',
        isReady:     false
      },
      {
        name:        'x34-cwf5-name',
        id:          'an-id3',
        mgmt:        { id: 'an-id3' },
        nameDisplay: 'b-cluster',
        isReady:     true
      },
      {
        name:        'local-name',
        id:          'local',
        mgmt:        { id: 'local' },
        nameDisplay: 'local',
        isReady:     true,
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
    expect(wrapper.find('[data-testid="top-level-menu-cluster-1"] .cluster-name p').text()).toStrictEqual('b-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-2"] .cluster-name p').text()).toStrictEqual('c-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-3"] .cluster-name p').text()).toStrictEqual('a-cluster');
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
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x33-cwf5-name',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x34-cwf5-name',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'local' },
                nameDisplay: 'local',
                isReady:     true,
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
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x33-cwf5-name',
                id:          'an-id2',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x34-cwf5-name',
                id:          'an-id3',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     false,
                pinned:      true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'local' },
                nameDisplay: 'local',
                isReady:     true,
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
                isReady:     true,
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
                isReady:     true
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
                isReady:     true,
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
                isReady:     true
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

  it('should not "crash" the component if the structure of banner settings is in an old format', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      global: {
        mocks: {
          $route: {},
          $store: {
            ...generateStore(
              [{ name: 'whatever' }],
              [
                // object based on https://github.com/rancher/dashboard/issues/10140#issuecomment-1883252402
                {
                  id:    SETTING.BANNERS,
                  value: JSON.stringify({
                    banner: {
                      color:      '#78c9cf',
                      background: '#27292e',
                      text:       'Hello World!'
                    },
                    showHeader: 'true',
                    showFooter: 'true'
                  })
                }
              ]
            ),
          }
        },

        stubs: ['BrandImage', 'router-link'],
      },
    });

    await waitForIt();

    expect(wrapper.vm.sideMenuStyle).toStrictEqual({
      marginBottom: '2em',
      marginTop:    '2em'
    });
  });

  describe('searching a term', () => {
    describe('should displays a no results message if have clusters but', () => {
      it('given no matching clusters', async() => {
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
                    nameDisplay: 'something else'
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
          data: () => ({ clusterFilter: search }),

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

        await waitForIt();

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.pinFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });
    });
  });
});
