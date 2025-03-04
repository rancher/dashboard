import { clone } from '@shell/utils/object';
import Dashboard from '@shell/pages/c/_cluster/explorer/index.vue';
import { shallowMount } from '@vue/test-utils';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { NODE_ARCHITECTURE } from '@shell/config/labels-annotations';
import { WORKLOAD_TYPES } from '@shell/config/types';

describe('page: cluster dashboard', () => {
  const mountOptions = {
    global: {
      stubs: {
        'router-link': true,
        LiveDate:      true
      },
      mocks: {
        $store: {
          dispatch: jest.fn(),
          getters:  {
            currentCluster: {
              id:                         'cluster',
              metadata:                   { creationTimestamp: Date.now() },
              status:                     { provider: 'foo' },
              kubernetesVersionBase:      '0.0.0',
              kubernetesVersionExtension: 'k3s',
            },
            'cluster/inError':   () => false,
            'cluster/schemaFor': jest.fn(),
            'cluster/canList':   jest.fn(),
            'cluster/byId':      () => {
              return {};
            },
            'cluster/all': jest.fn(),
            'i18n/exists': jest.fn(),
            'i18n/t':      (label: string) => label === 'generic.provisioning' ? '—' : jest.fn()(),
          }
        }
      },
    }
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

      options.global.mocks.$store.getters.currentCluster.status = {
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
    ['local', 'fleet', true, ['fleetControllerResource', 'fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'fleet', false, ['fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'cattle', false, ['cattleAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, false, [{ status: 'True' }], 1, 0],
    ]]
  ])('%p cluster - %p agent health box :', (_, agentId, isLocal, agentResources, statuses) => {
    it.each(statuses)('should NOT show %p status due to missing canList permissions', (status, iconClass, isLoaded, disconnected, error, conditions, readyReplicas, unavailableReplicas) => {
      const options = clone(mountOptions);

      options.global.mocks.$store.getters.currentCluster.isLocal = isLocal;

      const resources = agentResources.reduce((acc, r) => {
        const agent = {
          metadata: { state: { error } },
          spec:     { replicas: 1 },
          status:   {
            readyReplicas,
            unavailableReplicas,
            conditions
          }
        };

        return isLoaded ? {
          ...acc,
          [r]: agent
        } : 'loading';
      }, {});

      const wrapper = shallowMount(Dashboard, {
        ...options,
        data: () => ({
          ...resources,
          disconnected,
          canViewAgents: true
        })
      });

      const box = wrapper.find(`[data-testid="k8s-service-${ agentId }"]`);

      expect(box.exists()).toBe(false);
    });
  });

  describe.each([
    ['local', 'fleet', true, ['fleetControllerResource', 'fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', false, true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'fleet', false, ['fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', false, true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'cattle', false, ['cattleAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', false, true, false, false, [{ status: 'True' }], 1, 0],
    ]]
  ])('%p cluster - %p agent health box ::', (_, agentId, isLocal, agentResources, statuses) => {
    it.each(statuses)('should show %p status', async(status, iconClass, clickable, isLoaded, disconnected, error, conditions, readyReplicas, unavailableReplicas) => {
      let agentRoute = null;

      const options = clone(mountOptions);

      options.global.mocks.$store.getters.currentCluster.isLocal = isLocal;

      options.global.mocks.$store.getters['cluster/canList'] = (type: string) => !!(type === WORKLOAD_TYPES.DEPLOYMENT) || !!(type === WORKLOAD_TYPES.STATEFUL_SET);

      options.global.mocks.$router = {
        push: (route: any) => {
          agentRoute = route;
        }
      };

      const resources = agentResources.reduce((acc, r) => {
        const agent = {
          metadata: { state: { error } },
          spec:     { replicas: 1 },
          status:   {
            readyReplicas,
            unavailableReplicas,
            conditions
          }
        };

        return isLoaded ? {
          ...acc,
          [r]: agent
        } : 'loading';
      }, {});

      const wrapper = shallowMount(Dashboard, {
        ...options,
        data: () => ({
          ...resources,
          disconnected,
          canViewAgents: true
        })
      });

      const box = wrapper.find(`[data-testid="k8s-service-${ agentId }"]`);
      const icon = box.find('i');

      expect(box.element).toBeDefined();
      expect(box.element.classList).toContain(status);
      expect(!!(box.element as any).$_popper).toBe(clickable);
      expect(icon.element.classList).toContain(iconClass);

      await box.trigger('click');

      expect(!!agentRoute).toBe(clickable);
    });
  });

  it('local cluster - cattle agent health box - should be hidden', () => {
    const options = clone(mountOptions);

    options.global.mocks.$store.getters.currentCluster.isLocal = true;

    const wrapper = shallowMount(Dashboard, {
      ...options,
      data: () => ({
        cattleAgentResource: 'loading',
        disconnected:        false,
        canViewAgents:       true
      })
    });

    const box = wrapper.find(`[data-testid="k8s-service-cattle"]`);

    expect(box.exists()).toBe(false);
  });

  describe('cluster details', () => {
    it.each([
      ['clusterProvider', 'other', []],
      ['kubernetesVersion', 'glance.version', []],
      ['created', 'glance.created', []],
      ['architecture', 'mixed', [{ labels: { [NODE_ARCHITECTURE]: 'amd64' } }, { labels: { [NODE_ARCHITECTURE]: 'intel' } }]],
      ['architecture', 'mixed', [{ labels: { [NODE_ARCHITECTURE]: 'amd64' } }, { labels: { } }]],
      ['architecture', 'amd64', [{ labels: { [NODE_ARCHITECTURE]: 'amd64' } }]],
      ['architecture', 'unknown', [{ labels: { } }]],
      ['architecture', 'glance.architecture', [{ metadata: { state: { transitioning: true } } }]],
    ])('should show %p label %p', (label, text, nodes) => {
      const options = clone(mountOptions);

      options.global.mocks.$store.getters['cluster/all'] = () => nodes;

      const wrapper = shallowMount(Dashboard, options);

      const element = wrapper.find(`[data-testid="${ label }__label"]`).element;

      expect(element.textContent).toContain(text);
    });
  });
});
