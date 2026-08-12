import { shallowMount, VueWrapper } from '@vue/test-utils';
import ResourceYaml from '@shell/components/ResourceYaml.vue';
import { _EDIT } from '@shell/config/query-params';

const t = (key: string): string => key;

describe('component: ResourceYaml', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = () => {
    const dispatch = jest.fn();
    const store = {
      getters: {
        currentStore:              () => 'current_store',
        'current_store/schemaFor': jest.fn(),
      },
      dispatch,
    };

    const w = shallowMount(ResourceYaml, {
      props: {
        mode:  _EDIT,
        value: { type: 'apps.deployment' },
        yaml:  'kind: Deployment',
      },
      global: {
        mocks: {
          $store:  store,
          $route:  { query: {} },
          $router: { applyQuery: jest.fn() },
          t,
        },
      },
    });

    return { wrapper: w, dispatch };
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }

    jest.clearAllMocks();
  });

  describe('method: applyTemplateYaml', () => {
    it('should update currentYaml and push the value into the editor', () => {
      const mounted = mountComponent();

      wrapper = mounted.wrapper;
      wrapper.vm.updateValue = jest.fn();

      wrapper.vm.applyTemplateYaml('kind: Deployment\nmetadata:\n  name: from-template');

      expect(wrapper.vm.currentYaml).toBe('kind: Deployment\nmetadata:\n  name: from-template');
      expect(wrapper.vm.updateValue).toHaveBeenCalledWith('kind: Deployment\nmetadata:\n  name: from-template');
    });
  });
});
