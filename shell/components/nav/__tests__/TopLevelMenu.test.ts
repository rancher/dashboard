import TopLevelMenu from '@shell/components/nav/TopLevelMenu';
import { SETTING } from '@shell/config/settings';
import { mount, Wrapper } from '@vue/test-utils';

// DISCLAIMER: This should not be added here, although we have several store requests which are irrelevant
const defaultStore = {
  'management/byId':         jest.fn(),
  'management/schemaFor':    jest.fn(),
  'i18n/t':                  jest.fn(),
  'features/get':            jest.fn(),
  'prefs/theme':             jest.fn(),
  defaultClusterId:          jest.fn(),
  clusterId:                 jest.fn(),
  'type-map/activeProducts': [],
};

describe('topLevelMenu', () => {
  it('should display clusters', () => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      mocks: {
        $store: {
          getters: {
            'management/all': () => [{ name: 'whatever' }],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

    const cluster = wrapper.find('[data-testid="top-level-menu-cluster-0"]');

    expect(cluster.exists()).toBe(true);
  });

  it('should show local cluster always on top of the list of clusters (unpinned and ready clusters)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      data: () => {
        return { hasProvCluster: true, showPinClusters: true };
      },
      mocks: {
        $store: {
          getters: {
            // these objs are doubling as a prov clusters
            // from which the "description" field comes from
            // This is triggered by the "hasProvCluster" above
            // (check all "management/all" getters on the component code)
            'management/all': () => [
              {
                name:        'x32-cwf5-name',
                id:          'x32-cwf5-id',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                isReady:     true
              },
              {
                name:        'x33-cwf5-name',
                id:          'x33-cwf5-id',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     true
              },
              {
                name:        'x34-cwf5-name',
                id:          'x34-cwf5-id',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'an-id4' },
                nameDisplay: 'local',
                isReady:     true
              },
            ],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

    expect(wrapper.find('[data-testid="top-level-menu-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-2"] .cluster-name p').text()).toStrictEqual('b-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-3"] .cluster-name p').text()).toStrictEqual('c-cluster');
  });

  it('should show local cluster always on top of the list of clusters (unpinned and mix ready/unready clusters)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      data: () => {
        return { hasProvCluster: true, showPinClusters: true };
      },
      mocks: {
        $store: {
          getters: {
            // these objs are doubling as a prov clusters
            // from which the "description" field comes from
            // This is triggered by the "hasProvCluster" above
            // (check all "management/all" getters on the component code)
            'management/all': () => [
              {
                name:        'x32-cwf5-name',
                id:          'x32-cwf5-id',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                isReady:     true
              },
              {
                name:        'x33-cwf5-name',
                id:          'x33-cwf5-id',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     false
              },
              {
                name:        'x34-cwf5-name',
                id:          'x34-cwf5-id',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'an-id4' },
                nameDisplay: 'local',
                isReady:     true
              },
            ],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

    expect(wrapper.find('[data-testid="top-level-menu-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-1"] .cluster-name p').text()).toStrictEqual('b-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-2"] .cluster-name p').text()).toStrictEqual('c-cluster');
    expect(wrapper.find('[data-testid="top-level-menu-cluster-3"] .cluster-name p').text()).toStrictEqual('a-cluster');
  });

  it('should show local cluster always on top of the list of clusters (pinned and ready clusters)', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      data: () => {
        return { hasProvCluster: true, showPinClusters: true };
      },
      mocks: {
        $store: {
          getters: {
            // these objs are doubling as a prov clusters
            // from which the "description" field comes from
            // This is triggered by the "hasProvCluster" above
            // (check all "management/all" getters on the component code)
            'management/all': () => [
              {
                name:        'x32-cwf5-name',
                id:          'x32-cwf5-id',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x33-cwf5-name',
                id:          'x33-cwf5-id',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x34-cwf5-name',
                id:          'x34-cwf5-id',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'an-id4' },
                nameDisplay: 'local',
                isReady:     true,
                pinned:      true
              },
            ],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

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
      mocks: {
        $store: {
          getters: {
            // these objs are doubling as a prov clusters
            // from which the "description" field comes from
            // This is triggered by the "hasProvCluster" above
            // (check all "management/all" getters on the component code)
            'management/all': () => [
              {
                name:        'x32-cwf5-name',
                id:          'x32-cwf5-id',
                mgmt:        { id: 'an-id1' },
                nameDisplay: 'c-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x33-cwf5-name',
                id:          'x33-cwf5-id',
                mgmt:        { id: 'an-id2' },
                nameDisplay: 'a-cluster',
                isReady:     true,
                pinned:      true
              },
              {
                name:        'x34-cwf5-name',
                id:          'x34-cwf5-id',
                mgmt:        { id: 'an-id3' },
                nameDisplay: 'b-cluster',
                isReady:     false,
                pinned:      true
              },
              {
                name:        'local-name',
                id:          'local',
                mgmt:        { id: 'an-id4' },
                nameDisplay: 'local',
                isReady:     true,
                pinned:      true
              },
            ],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

    expect(wrapper.find('[data-testid="pinned-ready-cluster-0"] .cluster-name p').text()).toStrictEqual('local');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-1"] .cluster-name p').text()).toStrictEqual('a-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-2"] .cluster-name p').text()).toStrictEqual('c-cluster');
    expect(wrapper.find('[data-testid="pinned-ready-cluster-3"] .cluster-name p').text()).toStrictEqual('b-cluster');
  });

  it('should show description if it is available on the prov cluster', async() => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      data: () => {
        return { hasProvCluster: true, showPinClusters: true };
      },
      mocks: {
        $store: {
          getters: {
            // these objs are doubling as a prov clusters
            // from which the "description" field comes from
            // This is triggered by the "hasProvCluster" above
            // (check all "management/all" getters on the component code)
            // https://github.com/rancher/dashboard/issues/10441
            'management/all': () => [
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
            ],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

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
      data: () => {
        return { hasProvCluster: false, showPinClusters: true };
      },
      mocks: {
        $store: {
          getters: {
            // "hasProvCluster" as false will make this getter
            // a mgmt cluster only return, therefore covering the
            // scenario where descriptions come from RKE1/ember world clusters
            // https://github.com/rancher/dashboard/issues/10441
            'management/all': () => [
              // pinned ready cluster
              {
                name:        'whatever',
                id:          'an-id1',
                description: 'some-description1',
                nameDisplay: 'some-label',
                isReady:     true,
                pinned:      true
              },
              // pinned NOT ready cluster
              {
                name:        'whatever',
                id:          'an-id2',
                description: 'some-description2',
                nameDisplay: 'some-label',
                pinned:      true
              },
              // unpinned ready cluster
              {
                name:        'whatever',
                id:          'an-id3',
                description: 'some-description3',
                nameDisplay: 'some-label',
                isReady:     true
              },
              // unpinned NOT ready cluster
              {
                name:        'whatever',
                id:          'an-id4',
                description: 'some-description4',
                nameDisplay: 'some-label'
              },
            ],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

    const description1 = wrapper.find('[data-testid="pinned-menu-cluster-an-id1"] .description');
    const description2 = wrapper.find('[data-testid="pinned-menu-cluster-disabled-an-id2"] .description');
    const description3 = wrapper.find('[data-testid="menu-cluster-an-id3"] .description');
    const description4 = wrapper.find('[data-testid="menu-cluster-disabled-an-id4"] .description');

    expect(description1.text()).toStrictEqual('some-description1');
    expect(description2.text()).toStrictEqual('some-description2');
    expect(description3.text()).toStrictEqual('some-description3');
    expect(description4.text()).toStrictEqual('some-description4');
  });

  it('should not "crash" the component if the structure of banner settings is in an old format', () => {
    const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
      mocks: {
        $store: {
          getters: {
            'management/all': () => [{ name: 'whatever' },
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
              }],
            ...defaultStore
          },
        },
      },
      stubs: ['BrandImage', 'router-link']
    });

    expect(wrapper.vm.sideMenuStyle).toStrictEqual({
      marginBottom: '2em',
      marginTop:    '2em'
    });
  });

  describe('searching a term', () => {
    describe('should displays a no results message if have clusters but', () => {
      it('given no matching clusters', () => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: 'whatever' }),
          mocks: {
            $store: {
              getters: {
                'management/all': () => [{ nameDisplay: 'something else' }],
                ...defaultStore
              },
            },
          },
          stubs: ['BrandImage', 'router-link']
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(noResults.exists()).toBe(true);
      });

      it('given no matched pinned clusters', () => {
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: 'whatever' }),
          mocks: {
            $store: {
              getters: {
                'management/all': () => [{ nameDisplay: 'something else', pinned: true }],
                ...defaultStore
              },
            },
          },
          stubs: ['BrandImage', 'router-link']
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(noResults.exists()).toBe(true);
      });
    });

    describe('should not displays a no results message', () => {
      it('given matching clusters', () => {
        const search = 'you found me';
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: search }),
          mocks: {
            $store: {
              getters: {
                'management/all': () => [{ nameDisplay: search }],
                ...defaultStore
              },
            },
          },
          stubs: ['BrandImage', 'router-link']
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.clustersFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });

      it('given clusters with status pinned', () => {
        const search = 'you found me';
        const wrapper: Wrapper<InstanceType<typeof TopLevelMenu>> = mount(TopLevelMenu, {
          data:  () => ({ clusterFilter: search }),
          mocks: {
            $store: {
              getters: {
                'management/all': () => [{ nameDisplay: search, pinned: true }],
                ...defaultStore
              },
            },
          },
          stubs: ['BrandImage', 'router-link']
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.pinFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });
    });
  });
});
