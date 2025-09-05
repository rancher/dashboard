import { clone } from '@shell/utils/object';
import ClusterTools from '@shell/pages/c/_cluster/explorer/tools/index.vue';
import { shallowMount } from '@vue/test-utils';
import { MANAGEMENT } from '@shell/config/types';
import { RcItemCard } from '@components/RcItemCard';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';

describe('page: cluster tools', () => {
  const mountOptions = {
    computed: {
      appChartCards: () => [
        {
          id:             'cluster/rancher-charts/rancher-alerting-drivers',
          header:         { title: { text: 'Rancher Alerting Drivers' } },
          content:        { text: 'Some description' },
          image:          { src: '' },
          subHeaderItems: [],
          installedApp:   {},
          rawChart:       { blocked: false }
        }
      ]
    },
    methods: { getCardActions: (ClusterTools as any).methods.getCardActions },
    global:  {
      mocks: {
        $route:      { query: {} },
        t:           (key: string) => key,
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
            'i18n/t':       (key: string) => key,
          }
        }
      },
    }
  };

  it('should show apps catalog', async() => {
    const wrapper = shallowMount(ClusterTools, { ...mountOptions, methods: { getCardActions: () => [] } });

    await (ClusterTools as any).fetch.call(wrapper.vm);
    const cards = wrapper.findComponent(RcItemCard);

    expect(cards.exists()).toBe(true);
  });

  it('should show apps catalog when no permissions to `project` schema', async() => {
    const options = clone(mountOptions);

    options.global.mocks.$store.dispatch = (schema: string, opt: { type: string }) => {
      if (schema === 'management/findAll' && opt.type === MANAGEMENT.PROJECT) {
        return null;
      }
    };

    const wrapper = shallowMount(ClusterTools, { ...options, methods: { getCardActions: () => [] } });

    await (ClusterTools as any).fetch.call(wrapper.vm);
    const cards = wrapper.findComponent(RcItemCard);

    expect(cards.exists()).toBe(true);
  });

  describe('getCardActions', () => {
    it('should return "install" action for an uninstalled chart', () => {
      const wrapper = shallowMount(ClusterTools, mountOptions);
      const card = {
        installedApp: null,
        rawChart:     { blocked: false }
      };
      const actions = wrapper.vm.getCardActions(card);

      expect(actions).toHaveLength(1);
      expect(actions[0]).toStrictEqual({
        label:   'catalog.tools.action.install',
        action:  'install',
        icon:    'icon-plus',
        enabled: true
      });
    });

    it('should return "edit" action for an installed chart with no upgrade', () => {
      const wrapper = shallowMount(ClusterTools, mountOptions);
      const card = {
        installedApp: { upgradeAvailable: APP_UPGRADE_STATUS.NO_UPGRADE },
        rawChart:     {}
      };
      const actions = wrapper.vm.getCardActions(card);

      expect(actions).toHaveLength(2); // Edit and Remove
      expect(actions[0]).toStrictEqual({
        label:  'catalog.tools.action.edit',
        icon:   'icon-edit',
        action: 'edit',
      });
    });

    it('should return "upgrade" action for an installed chart with an upgrade', () => {
      const wrapper = shallowMount(ClusterTools, mountOptions);
      const card = {
        installedApp: { upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE },
        rawChart:     {}
      };
      const actions = wrapper.vm.getCardActions(card);

      expect(actions).toHaveLength(2); // Upgrade and Remove
      expect(actions[0]).toStrictEqual({
        label:  'catalog.tools.action.upgrade',
        icon:   'icon-upgrade-alt',
        action: 'edit',
      });
    });
  });
});
