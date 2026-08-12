import { shallowMount, VueWrapper } from '@vue/test-utils';
import ResourceYaml from '@shell/components/ResourceYaml.vue';
import { _EDIT } from '@shell/config/query-params';
import ResourceTemplateUtils from '@shell/utils/resource-template';

jest.mock('@shell/utils/resource-template', () => ({
  __esModule: true,
  default:    { applyTemplate: jest.fn() },
}));

const t = (key: string): string => key;

describe('component: ResourceYaml', () => {
  let wrapper: VueWrapper<any>;

  const mockConfigMap = { metadata: { namespace: 'default', name: 'my-template' } };

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

  describe('method: onTemplateSelected', () => {
    it('should prompt a confirmation modal before applying the template', () => {
      const mounted = mountComponent();

      wrapper = mounted.wrapper;
      mounted.wrapper.vm.onTemplateSelected(mockConfigMap);

      expect(mounted.dispatch).toHaveBeenCalledWith('current_store/promptModal', {
        component:      'GenericPrompt',
        componentProps: expect.objectContaining({
          title:       'resourceTemplateSelector.confirmTitle',
          body:        'resourceTemplateSelector.confirmBodyYaml',
          applyMode:   'apply',
          applyAction: expect.any(Function),
        }),
      });
    });

    it('should update currentYaml with the applied template when confirmed', async() => {
      (ResourceTemplateUtils.applyTemplate as jest.Mock).mockReturnValue('kind: Deployment\nmetadata:\n  name: from-template');

      const mounted = mountComponent();

      wrapper = mounted.wrapper;
      mounted.wrapper.vm.updateValue = jest.fn();
      mounted.wrapper.vm.onTemplateSelected(mockConfigMap);

      const { applyAction } = mounted.dispatch.mock.calls[0][1].componentProps;

      await applyAction();

      expect(ResourceTemplateUtils.applyTemplate).toHaveBeenCalledWith(mounted.wrapper.vm.value, mockConfigMap);
      expect(mounted.wrapper.vm.currentYaml).toBe('kind: Deployment\nmetadata:\n  name: from-template');
      expect(mounted.wrapper.vm.updateValue).toHaveBeenCalledWith('kind: Deployment\nmetadata:\n  name: from-template');
    });
  });
});
