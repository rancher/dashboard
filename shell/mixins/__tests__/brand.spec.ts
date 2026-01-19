import { mount } from '@vue/test-utils';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import Brand from '@shell/mixins/brand';
import CspAdapterUtils from '@shell/utils/cspAdaptor';

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
    const spyManagementDispatch = jest.spyOn(store, 'dispatch');

    CspAdapterUtils.resetState();

    return {
      wrapper,
      store,
      spyManagementDispatch,
    };
  };

  describe('should make correct requests', () => {
    it('vai off', async() => {
      const { wrapper, spyManagementDispatch } = createWrapper(false);

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm);

      // wrapper.vm.$nextTick();
      expect(spyManagementDispatch).toHaveBeenNthCalledWith(1, 'management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: 'multi', redirectUnauthorized: false, url: `/v1/${ MANAGEMENT.SETTING }s`
        }
      });
      expect(spyManagementDispatch).toHaveBeenNthCalledWith(2, 'management/findAll', { type: CATALOG.APP });
    });

    it('vai on', async() => {
      const { wrapper, spyManagementDispatch } = createWrapper(true);

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm);

      expect(spyManagementDispatch).toHaveBeenNthCalledWith(1, 'management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: 'multi', url: `/v1/${ MANAGEMENT.SETTING }s`, redirectUnauthorized: false
        }
      });
      expect(spyManagementDispatch).toHaveBeenNthCalledWith(2, 'management/findPage', {
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
          },
          transient: true,
          watch:     false
        }
      });
    });
  });

  describe('cspAdapter', () => {
    it('should have correct csp values (off)', async() => {
      const { wrapper, store } = createWrapper();

      const spyManagementDispatch = jest.spyOn(store, 'dispatch').mockImplementation((_, options) => {
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

      expect(spyManagementDispatch).toHaveBeenCalledTimes(2);

      expect(wrapper.vm.canCalcCspAdapter).toBeTruthy();
      expect(wrapper.vm.cspAdapter).toBeFalsy();
    });

    it.each(['rancher-csp-adapter', 'rancher-csp-billing-adapter'])('should have correct csp values (on - %p )', async(chartName) => {
      const { wrapper, store } = createWrapper();

      const spyManagementDispatch = jest.spyOn(store, 'dispatch').mockImplementation((_, options) => {
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

      expect(spyManagementDispatch).toHaveBeenCalledTimes(2);

      expect(wrapper.vm.canCalcCspAdapter).toBeTruthy();
      expect(wrapper.vm.cspAdapter).toBeTruthy();
    });
  });
});
