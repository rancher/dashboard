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
          installedApp:   { spec: { chart: { metadata: { version: '1.0.0' } } } },
          rawChart:       { versions: [{ version: '1.0.0' }], blocked: false }
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

    it('should return all actions for an installed chart', () => {
      const wrapper = shallowMount(ClusterTools, mountOptions);
      const card = {
        installedApp: {
          spec:             { chart: { metadata: { version: '1.0.1' } } },
          upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE
        },
        rawChart: { versions: [{ version: '1.0.2' }, { version: '1.0.1' }, { version: '1.0.0' }] }
      };
      const actions = wrapper.vm.getCardActions(card);

      expect(actions).toHaveLength(5); // Upgrade, Edit, Downgrade, separator, Remove
      expect(actions[0]).toStrictEqual({
        label:  'catalog.tools.action.upgrade',
        icon:   'icon-upgrade-alt',
        action: 'upgrade'
      });
      expect(actions[1]).toStrictEqual({
        label:  'catalog.tools.action.edit',
        icon:   'icon-edit',
        action: 'edit'
      });
      expect(actions[2]).toStrictEqual({
        label:  'catalog.tools.action.downgrade',
        icon:   'icon-downgrade-alt',
        action: 'downgrade'
      });
      expect(actions[3]).toStrictEqual({ divider: true });
      expect(actions[4]).toStrictEqual({
        label:  'catalog.tools.action.remove',
        icon:   'icon-delete',
        action: 'remove'
      });
    });

    it('should not show upgrade if not available', () => {
      const wrapper = shallowMount(ClusterTools, mountOptions);
      const card = {
        installedApp: {
          spec:             { chart: { metadata: { version: '1.0.2' } } },
          upgradeAvailable: APP_UPGRADE_STATUS.NO_UPGRADE
        },
        rawChart: { versions: [{ version: '1.0.2' }, { version: '1.0.1' }, { version: '1.0.0' }] }
      };
      const actions = wrapper.vm.getCardActions(card);

      expect(actions.find((a) => a.action === 'upgrade')).toBeUndefined();
      expect(actions).toHaveLength(4); // Edit, Downgrade, separator, Remove
    });

    it('should not show downgrade if not available', () => {
      const wrapper = shallowMount(ClusterTools, mountOptions);
      const card = {
        installedApp: {
          spec:             { chart: { metadata: { version: '1.0.0' } } },
          upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE
        },
        rawChart: { versions: [{ version: '1.0.1' }, { version: '1.0.0' }] }
      };
      const actions = wrapper.vm.getCardActions(card);

      expect(actions.find((a) => a.action === 'downgrade')).toBeUndefined();
      expect(actions).toHaveLength(4); // Upgrade, Edit, separator, Remove
    });
  });
});
