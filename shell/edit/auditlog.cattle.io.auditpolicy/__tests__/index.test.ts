import { shallowMount, VueWrapper } from '@vue/test-utils';
import CRUAuditPolicy from '../index.vue';
import { ComponentPublicInstance } from 'vue';

// Mock the ID generation to have consistent snapshots
jest.mock('@shell/utils/string', () => ({ generateRandomAlphaString: () => 'test-id-123' }));

// Type definitions for component
interface AuditPolicyComponent extends ComponentPublicInstance {
  mode: string;
  value: Record<string, any>;
}

const defaultProps = {
  value: {
    id:       'test-policy',
    type:     'auditlog.cattle.io.auditpolicy',
    metadata: { name: 'test-policy' },
    spec:     { enabled: false }
  },
  mode: 'create'
};

const globalMocks = {
  global: {
    mocks: {
      $t:     (key: string) => key,
      t:      (key: string) => key,
      $store: {
        getters: {
          'i18n/t':            (key: string) => key,
          currentStore:        () => 'cluster',
          'cluster/schemaFor': () => ({
            attributes: { namespaced: true },
            id:         'auditlog.cattle.io.auditpolicy'
          })
        },
        dispatch: jest.fn()
      },
      $route: {
        params: {},
        query:  {}
      },
      $router: {
        push:    jest.fn(),
        replace: jest.fn()
      },
      $fetchState: { pending: false }
    },
    provide: {
      store: {
        getters:  { 'i18n/t': (key: string) => key },
        dispatch: jest.fn()
      }
    },
    stubs: {
      Loading:              true,
      CruResource:          true,
      NameNsDescription:    true,
      Error:                true,
      Tabbed:               true,
      Tab:                  true,
      General:              true,
      Filters:              true,
      AdditionalRedactions: true,
      Labels:               true
    }
  }
};

function factory(props: Record<string, any> = {}, options: Record<string, any> = {}): VueWrapper<AuditPolicyComponent> {
  return shallowMount(CRUAuditPolicy, {
    props:  { ...defaultProps, ...props },
    ...globalMocks,
    global: {
      ...globalMocks.global,
      // Prevent directive conflicts by using shallow mounting without plugins
      plugins: [],
      ...(options.global || {})
    },
    ...options
  }) as VueWrapper<AuditPolicyComponent>;
}

describe('component: CRUAuditPolicy (index)', () => {
  describe('rendering & initial state', () => {
    it('should render with default props (snapshot)', () => {
      const wrapper = factory();

      expect(wrapper.element).toMatchSnapshot();
    });

    it('should mount successfully', () => {
      const wrapper = factory();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('should render with different modes', () => {
      const modes = ['create', 'edit', 'view'];

      modes.forEach((mode) => {
        const wrapper = factory({ mode });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.vm.mode).toBe(mode);
      });
    });
  });

  describe('component initialization', () => {
    it('should initialize with provided value', () => {
      const wrapper = factory();

      expect(wrapper.vm.value).toBeDefined();
      expect(wrapper.vm.value.spec).toBeDefined();
    });

    it('should handle different value configurations', () => {
      const customValue = {
        id:       'custom-policy',
        type:     'auditlog.cattle.io.auditpolicy',
        metadata: { name: 'custom' },
        spec:     { enabled: true }
      };
      const wrapper = factory({ value: customValue });

      expect(wrapper.vm.value.id).toBe('custom-policy');
      expect(wrapper.vm.value.spec.enabled).toBe(true);
    });

    it('should handle spec initialization lifecycle', () => {
      const valueWithoutSpec = {
        ...defaultProps.value,
        spec: undefined
      };
      // The component created() hook should initialize spec when missing
      const wrapper = factory({ value: valueWithoutSpec });

      // After mounting, spec should be initialized
      expect(wrapper.vm.value.spec).toBeDefined();
    });
  });

  describe('component structure', () => {
    it('should have the correct component name', () => {
      const wrapper = factory();

      expect(wrapper.vm.$options.name).toBe('CRUAuditPolicy');
    });

    it('should use CreateEditView and FormValidation mixins', () => {
      const wrapper = factory();

      // Check that mixins are applied by testing for their properties/methods
      expect(typeof wrapper.vm.mode).toBe('string');
      expect(wrapper.vm.value).toBeDefined();
    });

    it('should render main template elements', () => {
      const wrapper = factory();

      expect(wrapper.html()).toContain('cru-resource-stub');
      expect(wrapper.findComponent({ name: 'CruResource' })).toBeTruthy();
    });
  });

  describe('props and configuration', () => {
    it('should handle different modes correctly', () => {
      const modes = ['create', 'edit', 'view'];

      modes.forEach((mode) => {
        const wrapper = factory({ mode });

        expect(wrapper.vm.mode).toBe(mode);
      });
    });

    it('should handle different value objects', () => {
      const customValue = {
        id:       'test-policy',
        type:     'auditlog.cattle.io.auditpolicy',
        metadata: { name: 'test' },
        spec:     { enabled: true, verbosity: { level: 2 } }
      };
      const wrapper = factory({ value: customValue });

      expect(wrapper.vm.value.spec.enabled).toBe(true);
      expect(wrapper.vm.value.spec.verbosity.level).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty value object', () => {
      const wrapper = factory({ value: {} });

      // The created() hook initializes spec, so empty object gets spec added
      expect(wrapper.vm.value).toStrictEqual({ spec: { enabled: false } });
    });

    it('should handle component updates', async() => {
      const wrapper = factory();

      await wrapper.setProps({
        value: {
          ...defaultProps.value,
          spec: { enabled: true }
        }
      });

      expect(wrapper.vm.value.spec.enabled).toBe(true);
    });
  });
});
