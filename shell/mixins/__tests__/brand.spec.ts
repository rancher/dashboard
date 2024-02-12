import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Blank from '@shell/components/templates/blank.vue';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';

describe('brandMixin', () => {
  const createWrapper = () => {
    const localVue = createLocalVue();

    localVue.use(Vuex);

    const store = new Vuex.Store({
      state:   {},
      actions: {
        'management/findAll': (type, opt) => {
          if (type === MANAGEMENT.SETTING) {
            return [];
          }
          if (type === CATALOG.APP) {
            return [];
          }
        }
      },
      getters: {
        'auth/loggedIn':        () => true,
        'management/canList':   () => () => true,
        'management/schemaFor': () => () => undefined
      }
    });

    const spyManagementFindAll = jest.spyOn(store, 'dispatch');

    const wrapper = shallowMount(Blank, {
      store,
      localVue,
      stubs: ['router-link', 'router-view'],
      mocks: { $config: {}, $route: { path: '' } }
    });

    return {
      wrapper,
      store,
      spyManagementFindAll
    };
  };

  it('should make correct requests', async() => {
    const { wrapper, spyManagementFindAll } = createWrapper();

    // NOTE - wrapper.vm.$options.fetch() doesn't work
    await wrapper.vm.$options.fetch.apply(wrapper.vm, []);

    expect(spyManagementFindAll).toHaveBeenNthCalledWith(1, 'management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
      }
    });
    expect(spyManagementFindAll).toHaveBeenNthCalledWith(2, 'management/findAll', { type: CATALOG.APP, opt: { filter: { 'metadata.name': 'rancher-csp-adapter,rancher-csp-billing-adapter' } } });
  });

  describe('cspAdapter', () => {
    it('should have correct csp values (off)', async() => {
      const { wrapper, store } = createWrapper();

      const spyManagementFindAll = jest.spyOn(store, 'dispatch').mockImplementation((_, options) => {
        const { type } = options as any;

        if (type === MANAGEMENT.SETTING) {
          return Promise.resolve([]);
        }
        if (type === CATALOG.APP) {
          return Promise.resolve([]);
        }

        return Promise.reject(new Error('reason'));
      });

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm, []);

      expect(spyManagementFindAll).toHaveBeenCalledTimes(2);

      expect(wrapper.vm.canCalcCspAdapter).toBeTruthy();
      expect(wrapper.vm.cspAdapter).toBeFalsy();
    });

    it.each(['rancher-csp-adapter', 'rancher-csp-billing-adapter'])('should have correct csp values (on - %p )', async(chartName) => {
      const { wrapper, store } = createWrapper();

      const spyManagementFindAll = jest.spyOn(store, 'dispatch').mockImplementation((_, options) => {
        const { type } = options as any;

        if (type === MANAGEMENT.SETTING) {
          return Promise.resolve([]);
        }
        if (type === CATALOG.APP) {
          return Promise.resolve([{ metadata: { name: chartName } }]);
        }

        return Promise.reject(new Error('reason'));
      });

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm, []);

      expect(spyManagementFindAll).toHaveBeenCalledTimes(2);

      expect(wrapper.vm.canCalcCspAdapter).toBeTruthy();
      expect(wrapper.vm.cspAdapter).toBeTruthy();
    });
  });
});
