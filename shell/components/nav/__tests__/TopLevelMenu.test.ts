import { mount, Wrapper } from '@vue/test-utils';
import TopLevelMenu from '@shell/components/nav/TopLevelMenu';

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
      stubs: ['BrandImage', 'nuxt-link']
    });

    const cluster = wrapper.find('[data-testid="top-level-menu-cluster-0"]');

    expect(cluster.exists()).toBe(true);
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
          stubs: ['BrandImage', 'nuxt-link']
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
          stubs: ['BrandImage', 'nuxt-link']
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
          stubs: ['BrandImage', 'nuxt-link']
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
          stubs: ['BrandImage', 'nuxt-link']
        });

        const noResults = wrapper.find('[data-testid="top-level-menu-no-results"]');

        expect(wrapper.vm.pinFiltered).toHaveLength(1);
        expect(noResults.exists()).toBe(false);
      });
    });
  });
});
