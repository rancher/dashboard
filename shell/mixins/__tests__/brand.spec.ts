import { mount } from '@vue/test-utils';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import Brand from '@shell/mixins/brand';

describe('brandMixin', () => {
  const createWrapper = (vaiOn = false) => {
    const Component = {
      template: '<div></div>',
      mixins:   [Brand],
    };

    const data = {
      apps: null, haveAppsAndSettings: null, canPaginate: false
    };

    const store = {
      dispatch: (action, ...args) => {
        switch (action) {
        case 'management/findAll':
          if (args[0] === MANAGEMENT.SETTING) {
            return [];
          }
          if (args[0] === CATALOG.APP) {
            return [];
          }
          break;
        }
      },
      getters: {
        'auth/loggedIn':        () => true,
        'auth/fromHeader':      () => false,
        'management/byId':      () => undefined,
        'management/canList':   () => () => true,
        'management/schemaFor': (type: string) => {
          switch (type) {
          case MANAGEMENT.SETTING:
            return { linkFor: () => undefined };
          }
        },
        'management/generation':        () => undefined,
        'management/paginationEnabled': () => vaiOn,
        'management/all':               (type: string) => {
          switch (type) {
          case MANAGEMENT.SETTING:
            return [];
          }
        },
      }
    };

    const wrapper = mount(
      Component,
      {
        data:   () => data,
        global: { mocks: { $store: store } }
      });
    const spyManagementFindAll = jest.spyOn(store, 'dispatch');

    return {
      wrapper,
      store,
      spyManagementFindAll,
    };
  };

  describe('should make correct requests', () => {
    it('vai off', async() => {
      const { wrapper, spyManagementFindAll } = createWrapper(false);

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm);

      // wrapper.vm.$nextTick();
      expect(spyManagementFindAll).toHaveBeenNthCalledWith(1, 'management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: 'multi', redirectUnauthorized: false, url: `/v1/${ MANAGEMENT.SETTING }s`
        }
      });
      expect(spyManagementFindAll).toHaveBeenNthCalledWith(2, 'management/findAll', { type: CATALOG.APP });
    });

    it('vai on', async() => {
      const { wrapper, spyManagementFindAll } = createWrapper(true);

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm);

      expect(spyManagementFindAll).toHaveBeenNthCalledWith(1, 'management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: 'multi', url: `/v1/${ MANAGEMENT.SETTING }s`, redirectUnauthorized: false
        }
      });
      expect(spyManagementFindAll).toHaveBeenNthCalledWith(2, 'management/findPage', {
        type: CATALOG.APP,
        opt:  {
          pagination: {
            filters: [{
              equals: true,
              fields: [{
                equality: '=', equals: true, exact: true, exists: false, field: 'metadata.name', value: 'rancher-csp-adapter'
              }, {
                equality: '=', equals: true, exact: true, exists: false, field: 'metadata.name', value: 'rancher-csp-billing-adapter'
              }],
              param: 'filter'
            }],
            labelSelector:        undefined,
            page:                 null,
            pageSize:             null,
            projectsOrNamespaces: [],
            sort:                 []
          }
        }
      });
    });
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
