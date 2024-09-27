/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import ClusterRoleTemplateBinding from '@shell/edit/management.cattle.io.clusterroletemplatebinding.vue';
import Banner from '@components/Banner/Banner.vue';
import CruResource from '@shell/components/CruResource';

describe('view: management.cattle.io.clusterroletemplatebinding should', () => {
  let wrapper: any;

  const stubs = {
    ClusterPermissionsEditor: true,
    Loading:                  true
  };

  const requiredSetup = () => ({
    // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
    global: {
      mocks: {
        $store: {
          getters: {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            currentCluster:            { id: 'my-cluster' },
            currentProduct:            { inStore: 'whatever' },
            'i18n/t':                  (val) => val,
            'i18n/exists':             jest.fn(),
          },
          dispatch: jest.fn((action, payload) => {
            const actions = {
              'management/findAll':              () => [],
              'cru-resource/setCreateNamespace': jest.fn(),
            };

            if (actions[action]) {
              return actions[action](payload);
            }

            throw new Error(`Unknown action: ${ action }`);
          }),
        },
        $fetchState: { pending: false },
        $route:      { query: { AS: '' } },
        $router:     {
          applyQuery: jest.fn(),
          replace:    jest.fn()
        },
      },
      stubs,
    },
    propsData: { value: {} },
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should only show one error banner', async() => {
    const errors = ['mistake!'];

    wrapper = mount(ClusterRoleTemplateBinding, { ...requiredSetup() });

    const cruResourceElem = wrapper.findComponent(CruResource);

    await cruResourceElem.vm.$emit('error', errors);

    const bannerElems = wrapper.findAllComponents(Banner);

    expect(bannerElems).toHaveLength(1);
  });
});
