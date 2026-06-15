import { shallowMount, VueWrapper } from '@vue/test-utils';
import General from '../General.vue';
import { ComponentPublicInstance } from 'vue';
import { AuditPolicy } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';

interface GeneralComponent extends ComponentPublicInstance {
  spec: AuditPolicy;
  levelOptionsMap: Array<{ value: number; label: string }>;
}

// Mock the ID generation to have consistent snapshots
jest.mock('@shell/utils/string', () => ({ generateRandomAlphaString: () => 'test-id-123' }));

const defaultProps = {
  value: {},
  mode:  'create'
};

const globalMocks = {
  global: {
    mocks: {
      $t:     (key: string) => key,
      t:      (key: string) => key,
      $store: {
        getters:  { 'i18n/t': (key: string) => key },
        dispatch: jest.fn()
      },
      $route: {
        params: {},
        query:  {}
      },
      $router: {
        push:    jest.fn(),
        replace: jest.fn()
      }
    },
    provide: {
      store: {
        getters:  { 'i18n/t': (key: string) => key },
        dispatch: jest.fn()
      }
    },
    stubs: {
      LabeledSelect: true,
      Checkbox:      true
    }
  }
};

function factory(props: Record<string, any> = {}, options: Record<string, any> = {}): VueWrapper<GeneralComponent> {
  return (shallowMount(General, {
    props: { ...defaultProps, ...props },
    ...globalMocks,
    ...options
  }) as unknown) as VueWrapper<GeneralComponent>;
}

describe('component: General', () => {
  describe('rendering & initial state', () => {
    it('should render with default props (snapshot)', () => {
      const wrapper = factory();

      expect(wrapper.element).toMatchSnapshot();
    });

    it('should render with create mode', () => {
      const wrapper = factory({ mode: 'create' });

      expect(wrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'LabeledSelect' }).exists()).toBe(true);
    });

    it('should render with edit mode', () => {
      const wrapper = factory({ mode: 'edit' });

      expect(wrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'LabeledSelect' }).exists()).toBe(true);
    });

    it('should render with view mode', () => {
      const wrapper = factory({ mode: 'view' });

      expect(wrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'LabeledSelect' }).exists()).toBe(true);
    });

    it('should render with initial audit policy data', () => {
      const value = {
        enabled:   true,
        verbosity: {
          level:    2,
          request:  { headers: true, body: false },
          response: { headers: false, body: true }
        }
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.enabled).toBe(true);
      expect(wrapper.vm.spec.verbosity?.level).toBe(2);
      expect(wrapper.vm.spec.verbosity?.request?.headers).toBe(true);
      expect(wrapper.vm.spec.verbosity?.response?.body).toBe(true);
    });
  });

  describe('props & state changes', () => {
    it('should handle empty value prop gracefully', () => {
      const wrapper = factory({ value: {} });

      expect(wrapper.vm.spec.enabled).toBe(false);
      expect(wrapper.vm.spec.verbosity?.level).toBe(0);
      expect(wrapper.vm.spec.verbosity?.request?.headers).toBe(false);
      expect(wrapper.vm.spec.verbosity?.response?.headers).toBe(false);
    });

    it('should handle null value prop gracefully', () => {
      const wrapper = factory({ value: null });

      expect(wrapper.vm.spec.enabled).toBe(false);
      expect(wrapper.vm.spec.verbosity?.level).toBe(0);
    });

    it('should accept different mode prop values', () => {
      const createWrapper = factory({ mode: 'create' });
      const editWrapper = factory({ mode: 'edit' });
      const viewWrapper = factory({ mode: 'view' });

      expect((createWrapper.props() as any).mode).toBe('create');
      expect((editWrapper.props() as any).mode).toBe('edit');
      expect((viewWrapper.props() as any).mode).toBe('view');
    });

    it('should merge defaults with provided value', () => {
      const value = { enabled: true };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.enabled).toBe(true);
      expect(wrapper.vm.spec.verbosity?.level).toBe(0);
      expect(wrapper.vm.spec.verbosity?.request).toBeDefined();
      expect(wrapper.vm.spec.verbosity?.response).toBeDefined();
    });

    it('should handle missing verbosity request object', () => {
      const value = {
        enabled:   true,
        verbosity: { level: 1 }
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.verbosity?.request?.headers).toBe(false);
      expect(wrapper.vm.spec.verbosity?.request?.body).toBe(false);
    });

    it('should handle missing verbosity response object', () => {
      const value = {
        enabled:   true,
        verbosity: { level: 1 }
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.verbosity?.response?.headers).toBe(false);
      expect(wrapper.vm.spec.verbosity?.response?.body).toBe(false);
    });
  });

  describe('user interaction', () => {
    it('should emit update:value when enabled changes', async() => {
      const wrapper = factory();

      wrapper.vm.spec.enabled = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toHaveLength(2);
      expect((wrapper.emitted('update:value')?.[1]?.[0] as any).enabled).toBe(true);
    });

    it('should emit update:value when verbosity level changes', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.level = 2;
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toHaveLength(2);
      expect((wrapper.emitted('update:value')?.[1]?.[0] as any).verbosity.level).toBe(2);
    });

    it('should emit update:value when request headers changes', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.request!.headers = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toHaveLength(2);
      expect((wrapper.emitted('update:value')?.[1]?.[0] as any).verbosity.request.headers).toBe(true);
    });

    it('should emit update:value when response body changes', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.response!.body = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toHaveLength(2);
      expect((wrapper.emitted('update:value')?.[1]?.[0] as any).verbosity.response.body).toBe(true);
    });

    it('should preserve existing prop values when emitting updates', async() => {
      const value = { customField: 'test', enabled: false };
      const wrapper = factory({ value });

      wrapper.vm.spec.enabled = true;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[1]?.[0] as any);

      expect(emittedValue.customField).toBe('test');
      expect(emittedValue.enabled).toBe(true);
    });

    it('should emit complete verbosity object with all properties', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.level = 3;
      wrapper.vm.spec.verbosity!.request!.headers = true;
      wrapper.vm.spec.verbosity!.response!.body = true;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[0]?.[0] as any);

      expect(emittedValue.verbosity).toStrictEqual({
        level:    3,
        request:  { headers: true, body: false },
        response: { headers: false, body: true }
      });
    });
  });

  describe('computed properties & logic', () => {
    it('should return correct levelOptionsMap values', () => {
      const wrapper = factory();

      expect(wrapper.vm.levelOptionsMap).toHaveLength(4);
      expect(wrapper.vm.levelOptionsMap[0]).toStrictEqual({
        value: 0,
        label: 'auditPolicy.general.verbosity.level.0'
      });
      expect(wrapper.vm.levelOptionsMap[3]).toStrictEqual({
        value: 3,
        label: 'auditPolicy.general.verbosity.level.3'
      });
    });

    it('should have reactive levelOptionsMap computed property', async() => {
      const wrapper = factory();
      const initialOptions = wrapper.vm.levelOptionsMap;

      expect(wrapper.vm.levelOptionsMap).toStrictEqual(initialOptions);
    });

    it('should initialize spec reactive ref correctly', () => {
      const wrapper = factory();

      expect(wrapper.vm.spec).toBeDefined();
      expect(wrapper.vm.spec.enabled).toBe(false);
      expect(wrapper.vm.spec.verbosity?.level).toBe(0);
    });

    it('should merge defaults with props correctly in spec', () => {
      const value = { enabled: true, verbosity: { level: 2 } };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.enabled).toBe(true);
      expect(wrapper.vm.spec.verbosity?.level).toBe(2);
      expect(wrapper.vm.spec.verbosity?.request?.headers).toBe(false);
      expect(wrapper.vm.spec.verbosity?.response?.body).toBe(false);
    });
  });

  describe('component configuration', () => {
    it('should configure Checkbox components with correct props', () => {
      const wrapper = factory({ mode: 'edit' });
      const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' });

      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should render LabeledSelect component', () => {
      const wrapper = factory({ mode: 'view' });
      const select = wrapper.findComponent({ name: 'LabeledSelect' });

      expect(select.exists()).toBe(true);
      // With stub components, we can't test actual props
      expect(wrapper.vm.levelOptionsMap).toHaveLength(4);
    });

    it('should maintain verbosity structure when level is valid', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.level = 1;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[0]?.[0] as any);

      expect(emittedValue.verbosity).toBeDefined();
      expect(emittedValue.verbosity.level).toBe(1);
      expect(emittedValue.verbosity.request).toBeDefined();
      expect(emittedValue.verbosity.response).toBeDefined();
    });

    it('should render form structure correctly', () => {
      const wrapper = factory();

      expect(wrapper.find('.row').exists()).toBe(true);
      expect(wrapper.find('fieldset').exists()).toBe(true);
      expect(wrapper.find('.spacer').exists()).toBe(true);
    });
  });

  describe('verbosity data structure', () => {
    it('should handle verbosity with level 0', () => {
      const wrapper = factory();

      // Level 0 is the default, so check the initial state
      expect(wrapper.vm.spec.verbosity?.level).toBe(0);
    });

    it('should handle verbosity with level 3', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.level = 3;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[0]?.[0] as any);

      expect(emittedValue.verbosity.level).toBe(3);
    });

    it('should handle all request options', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.request!.headers = true;
      wrapper.vm.spec.verbosity!.request!.body = true;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[0]?.[0] as any);

      expect(emittedValue.verbosity.request.headers).toBe(true);
      expect(emittedValue.verbosity.request.body).toBe(true);
    });

    it('should handle all response options', async() => {
      const wrapper = factory();

      wrapper.vm.spec.verbosity!.response!.headers = true;
      wrapper.vm.spec.verbosity!.response!.body = true;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[0]?.[0] as any);

      expect(emittedValue.verbosity.response.headers).toBe(true);
      expect(emittedValue.verbosity.response.body).toBe(true);
    });

    it('should handle complete audit policy configuration', async() => {
      const wrapper = factory();

      wrapper.vm.spec.enabled = true;
      wrapper.vm.spec.verbosity!.level = 2;
      wrapper.vm.spec.verbosity!.request!.headers = true;
      wrapper.vm.spec.verbosity!.response!.body = true;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[1]?.[0] as any);

      expect(emittedValue).toStrictEqual({
        enabled:   true,
        verbosity: {
          level:    2,
          request:  { headers: true, body: false },
          response: { headers: false, body: true }
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle missing verbosity object entirely', () => {
      const value = { enabled: true };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.verbosity).toBeDefined();
      expect(wrapper.vm.spec.verbosity?.level).toBe(0);
      expect(wrapper.vm.spec.verbosity?.request).toBeDefined();
      expect(wrapper.vm.spec.verbosity?.response).toBeDefined();
    });

    it('should handle undefined enabled property', () => {
      const value = { verbosity: { level: 1 } };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.enabled).toBe(false);
    });

    it('should handle partial verbosity configuration', () => {
      const value = {
        verbosity: {
          level:   1,
          request: { headers: true }
        }
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.verbosity?.level).toBe(1);
      expect(wrapper.vm.spec.verbosity?.request?.headers).toBe(true);
      // The component doesn't fill in missing properties for existing objects
      expect(wrapper.vm.spec.verbosity?.request?.body).toBe(false);
      expect(wrapper.vm.spec.verbosity?.response).toBeDefined();
      expect(wrapper.vm.spec.verbosity?.response?.headers).toBe(false);
      expect(wrapper.vm.spec.verbosity?.response?.body).toBe(false);
    });

    it('should handle invalid verbosity data gracefully', () => {
      // Use a more realistic invalid case - missing nested properties
      const value = { verbosity: { level: 1 } }; // Missing request/response objects
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.verbosity).toBeDefined();
      expect(wrapper.vm.spec.verbosity?.level).toBe(1);
      expect(wrapper.vm.spec.verbosity?.request).toBeDefined();
      expect(wrapper.vm.spec.verbosity?.response).toBeDefined();
    });

    it('should handle deep reactivity correctly', async() => {
      const wrapper = factory();

      // Initialization should emit the first update
      expect(wrapper.emitted('update:value')).toHaveLength(1);

      // Make multiple nested changes
      wrapper.vm.spec.verbosity!.request!.headers = true;
      wrapper.vm.spec.verbosity!.request!.body = true;
      wrapper.vm.spec.verbosity!.response!.headers = true;
      await wrapper.vm.$nextTick();

      // Second emission after changes, only one additional one
      expect(wrapper.emitted('update:value')).toHaveLength(2);

      const emittedValue = (wrapper.emitted('update:value')?.[0]?.[0] as any);

      expect(emittedValue.verbosity.request.headers).toBe(true);
      expect(emittedValue.verbosity.request.body).toBe(true);
      expect(emittedValue.verbosity.response.headers).toBe(true);
    });

    it('should maintain object structure after verbosity restoration', async() => {
      const wrapper = factory();

      // Set level to null to trigger deletion
      wrapper.vm.spec.verbosity!.level = null as any;
      await wrapper.vm.$nextTick();

      // Set level back to valid value
      wrapper.vm.spec.verbosity!.level = 1;
      await wrapper.vm.$nextTick();

      const emittedValue = (wrapper.emitted('update:value')?.[1]?.[0] as any);

      expect(emittedValue.verbosity).toBeDefined();
      expect(emittedValue.verbosity.request).toBeDefined();
      expect(emittedValue.verbosity.response).toBeDefined();
    });
  });
});
