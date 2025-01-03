import { clone } from '@shell/utils/object';
import ClusterTools from '@shell/pages/c/_cluster/explorer/tools/index.vue';
import { shallowMount } from '@vue/test-utils';
import { MANAGEMENT } from '@shell/config/types';

describe('page: cluster tools', () => {
  const mountOptions = {
    computed: {
      options: () => [
        {
          chart: {
            id:       'cluster/rancher-charts/rancher-alerting-drivers',
            iconName: 'icon',
          },
          app: {}
        }
      ]
    },
    global: {
      mocks: {
        $route:      { query: {} },
        $fetchState: {
          pending: false, error: true, timestamp: Date.now()
        },
        $store: {
          dispatch: (schema: string, opt: { type: string }) => {
            if (schema === 'management/findAll' && opt.type === MANAGEMENT.PROJECT) {
              return [];
            }
          },
          getters: {
            'features/get':         () => true,
            'management/schemaFor': (schema: string) => {
              if (schema === MANAGEMENT.PROJECT) {
                return true;
              }
            },
            currentCluster: { id: 'cluster', status: { provider: 'provider' } },
            'i18n/t':       jest.fn(),
          }
        }
      },
    }
  };

  it('should show apps catalog', async() => {
    const wrapper = shallowMount(ClusterTools, mountOptions);

    await (ClusterTools as any).fetch.call(wrapper.vm);
    const cards = wrapper.find('[data-testid^="cluster-tools-app"]');

    expect(cards.exists()).toBe(true);
  });

  it('should show apps catalog when no permissions to `project` schema', async() => {
    const options = clone(mountOptions);

    options.global.mocks.$store.dispatch = (schema: string, opt: { type: string }) => {
      if (schema === 'management/findAll' && opt.type === MANAGEMENT.PROJECT) {
        return null;
      }
    };

    const wrapper = shallowMount(ClusterTools, options);

    await (ClusterTools as any).fetch.call(wrapper.vm);
    const cards = wrapper.find('[data-testid^="cluster-tools-app"]');

    expect(cards.exists()).toBe(true);
  });
});
