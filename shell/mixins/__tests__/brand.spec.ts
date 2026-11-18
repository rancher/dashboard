import { mount } from '@vue/test-utils';
import { MANAGEMENT } from '@shell/config/types';
import Brand from '@shell/mixins/brand';

describe('brandMixin', () => {
  const createWrapper = () => {
    const Component = {
      template: '<div></div>',
      mixins:   [Brand],
    };

    const store = {
      dispatch: (action: string, ...args: unknown[]): unknown => {
        switch (action) {
        case 'management/findAll':
          if (args[0] === MANAGEMENT.SETTING) {
            return [];
          }
          break;
        }
      },
      getters: {
        'auth/fromHeader':      () => false,
        'management/byId':      () => undefined,
        'management/schemaFor': (type: string) => {
          switch (type) {
          case MANAGEMENT.SETTING:
            return { linkFor: () => undefined };
          }
        },
        'management/generation': () => undefined,
        'management/all':        (type: string) => {
          switch (type) {
          case MANAGEMENT.SETTING:
            return [];
          }
        },
      }
    };

    const wrapper = mount(
      Component,
      { global: { mocks: { $store: store } } });
    const spyManagementDispatch = jest.spyOn(store, 'dispatch');

    return {
      wrapper,
      store,
      spyManagementDispatch,
    };
  };

  describe('should make correct requests', () => {
    it('fetches initial settings', async() => {
      const { wrapper, spyManagementDispatch } = createWrapper();

      // NOTE - wrapper.vm.$options.fetch() doesn't work
      await wrapper.vm.$options.fetch.apply(wrapper.vm);

      expect(spyManagementDispatch).toHaveBeenCalledWith('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: 'multi', redirectUnauthorized: false, url: `/v1/${ MANAGEMENT.SETTING }s`
        }
      });
    });
  });
});
