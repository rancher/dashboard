import { shallowMount, VueWrapper } from '@vue/test-utils';
import Legacy from '@shell/components/ResourceDetail/Masthead/legacy.vue';
import ResourceTemplateSelector from '@shell/components/ResourceTemplateSelector';
import { _EDIT, _CREATE, _VIEW } from '@shell/config/query-params';

const t = (key: string): string => key;

const mockStore = {
  getters: {
    'prefs/dev':               false,
    currentStore:              () => 'current_store',
    'current_store/schemaFor': jest.fn(),
    productId:                 'explorer',
    currentProduct:            { name: 'explorer' },
    'type-map/labelFor':       jest.fn(),
    'type-map/optionsFor':     jest.fn().mockReturnValue({}),
    'management/byId':         jest.fn(),
  },
  dispatch: jest.fn(),
  commit:   jest.fn(),
};

// legacy.vue's setup() calls useRuntimeFlag(useStore()) - needs a real-shaped store via useStore()
jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => mockStore }));

describe('component: Masthead/legacy', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (propsData: Record<string, any> = {}) => {
    return shallowMount(Legacy, {
      propsData: {
        value: { nameDisplay: 'test-resource', metadata: {} },
        mode:  _EDIT,
        ...propsData,
      },
      global: {
        mocks: {
          t,
          $store: mockStore,
          $route: { params: {} },
        },
      },
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('ResourceTemplateSelector', () => {
    it('should render when not viewing and canViewYaml is true', () => {
      wrapper = mountComponent({
        mode: _EDIT, canViewYaml: true, resource: 'apps.deployment'
      });

      const selector = wrapper.findComponent(ResourceTemplateSelector);

      expect(selector.exists()).toBe(true);
      expect(selector.props('resourceType')).toBe('apps.deployment');
    });

    it('should render in create mode too', () => {
      wrapper = mountComponent({
        mode: _CREATE, canViewYaml: true, resource: 'apps.deployment'
      });

      expect(wrapper.findComponent(ResourceTemplateSelector).exists()).toBe(true);
    });

    it('should not render when viewing', () => {
      wrapper = mountComponent({
        mode: _VIEW, canViewYaml: true, resource: 'apps.deployment'
      });

      expect(wrapper.findComponent(ResourceTemplateSelector).exists()).toBe(false);
    });

    it('should not render when canViewYaml is false', () => {
      wrapper = mountComponent({
        mode: _EDIT, canViewYaml: false, resource: 'apps.deployment'
      });

      expect(wrapper.findComponent(ResourceTemplateSelector).exists()).toBe(false);
    });

    it('should relay apply as apply-template', () => {
      wrapper = mountComponent({
        mode: _EDIT, canViewYaml: true, resource: 'apps.deployment'
      });

      const configMap = { metadata: { namespace: 'default', name: 'my-template' } };

      wrapper.findComponent(ResourceTemplateSelector).vm.$emit('apply', configMap);

      expect(wrapper.emitted('apply-template')).toBeTruthy();
      expect(wrapper.emitted('apply-template')![0]).toStrictEqual([configMap]);
    });
  });
});
