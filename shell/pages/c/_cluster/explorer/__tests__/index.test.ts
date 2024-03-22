import { clone } from '@shell/utils/object';
import Dashboard from '@shell/pages/c/_cluster/explorer/index.vue';
import { shallowMount } from '@vue/test-utils';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

describe('page: cluster dashboard', () => {
  const mountOptions = {
    computed: { monitoringStatus: () => ({ v2: true }) },
    stubs:    {
      'n-link': true,
      LiveDate: true
    },
    mocks: {
      $store: {
        dispatch: jest.fn(),
        getters:  {
          currentCluster: {
            id:       'cluster',
            metadata: { creationTimestamp: '' },
            status:   { provider: 'provider' },
          },
          'cluster/inError':   () => false,
          'cluster/schemaFor': jest.fn(),
          'cluster/all':       jest.fn(),
          'i18n/exists':       jest.fn(),
          'i18n/t':            jest.fn(),
        }
      }
    },
  };

  describe.each([
    'etcd',
    'scheduler',
    'controller-manager',
  ])('%p component health box', (componentId) => {
    it.each([
      [STATES_ENUM.HEALTHY, 'icon-checkmark', '', []],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', `foo`, []],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', `${ componentId }foo`, [{ status: 'True' }]],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', `${ componentId }foo`, [{ status: 'False' }]],
    ])('should show %p status', (status, iconClass, name, conditions) => {
      const options = clone(mountOptions);

      options.mocks.$store.getters.currentCluster.status = {
        provider:          'provider',
        componentStatuses: [{
          name,
          conditions
        }],
      };

      const wrapper = shallowMount(Dashboard, options);

      const box = wrapper.find(`[data-testid="k8s-service-${ componentId }"]`);
      const icon = box.find('i');

      expect(box.element).toBeDefined();
      expect(box.element.classList).toContain(status);
      expect(icon.element.classList).toContain(iconClass);
    });
  });

  describe.each([
    ['fleet', true, [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, [{ status: 'True' }], 1, 0],
    ]],
    ['cattle', false, [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, [{ status: 'True' }], 1, 0],
    ]]
  ])('%p agent health box', (agentId, isLocal, statuses) => {
    it.each(statuses)('should show %p status', (status, iconClass, isLoaded, disconnected, conditions, readyReplicas, unavailableReplicas) => {
      const options = clone(mountOptions);

      options.mocks.$store.getters.currentCluster.isLocal = isLocal;

      const agent = {
        spec:   { replicas: 1 },
        status: {
          readyReplicas,
          unavailableReplicas,
          conditions
        }
      };

      const wrapper = shallowMount(Dashboard, {
        ...options,
        data: () => ({
          [agentId]:     isLoaded ? agent : null,
          disconnected,
          canViewAgents: true
        })
      });

      const box = wrapper.find(`[data-testid="k8s-service-${ agentId }"]`);
      const icon = box.find('i');

      expect(box.element).toBeDefined();
      expect(box.element.classList).toContain(status);
      expect(icon.element.classList).toContain(iconClass);
    });
  });
});
