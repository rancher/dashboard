import { shallowMount, VueWrapper } from '@vue/test-utils';
import AdditionalRedactions from '../AdditionalRedactions.vue';
import { ComponentPublicInstance } from 'vue';
import { AuditPolicy } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';

// Mock the ID generation to have consistent snapshots
jest.mock('@shell/utils/string', () => ({ generateRandomAlphaString: () => 'test-id-123' }));

interface AdditionalRedactionsComponent extends ComponentPublicInstance {
  spec: AuditPolicy;
  addRedaction: () => void;
  removeRedaction: (index: number) => void;
  redactionLabel: (index: number) => string;
}

const defaultProps = {
  value: { additionalRedactions: [] },
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
    stubs: {
      Tabbed:    true,
      Tab:       true,
      ArrayList: true
    }
  }
};

function factory(props: Record<string, any> = {}, options: Record<string, any> = {}): VueWrapper<AdditionalRedactionsComponent> {
  return shallowMount(AdditionalRedactions, {
    props: { ...defaultProps, ...props },
    ...globalMocks,
    ...options
  }) as unknown as VueWrapper<AdditionalRedactionsComponent>;
}

describe('component: AdditionalRedactions', () => {
  describe('rendering & initial state', () => {
    it('should render with default props (snapshot)', () => {
      const wrapper = factory();

      expect(wrapper.element).toMatchSnapshot();
    });

    it('should render with create mode', () => {
      const wrapper = factory({ mode: 'create' });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.row.mb-40').exists()).toBe(true);
    });

    it('should render with edit mode', () => {
      const wrapper = factory({ mode: 'edit' });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.row.mb-40').exists()).toBe(true);
    });

    it('should render with initial redactions data', () => {
      const value = {
        additionalRedactions: [
          { headers: ['X-Test-Header'], paths: ['/api/test'] },
          { headers: ['Authorization'], paths: ['/secure'] }
        ]
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.additionalRedactions).toHaveLength(2);
    });
  });

  describe('props & state changes', () => {
    it('should handle empty value prop gracefully', () => {
      const wrapper = factory({ value: undefined });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.spec.additionalRedactions).toStrictEqual([]);
    });

    it('should handle null value prop gracefully', () => {
      const wrapper = factory({ value: null });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.spec.additionalRedactions).toStrictEqual([]);
    });

    it('should update when mode prop changes', async() => {
      const wrapper = factory({ mode: 'create' });

      expect((wrapper.props() as any).mode).toBe('create');
      await wrapper.setProps({ mode: 'view' });
      expect((wrapper.props() as any).mode).toBe('view');
    });

    it('should merge defaults with provided value', () => {
      const value = {
        additionalRedactions: [{ headers: ['Custom'], paths: ['/custom'] }],
        customProp:           'test'
      };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.additionalRedactions ?? [])).toHaveLength(1);
      expect((wrapper.vm.spec.additionalRedactions ?? [])[0]).toStrictEqual({ headers: ['Custom'], paths: ['/custom'] });
      expect((wrapper.vm.spec as any).customProp).toBe('test');
    });
  });

  describe('user interaction', () => {
    it('should emit update:value when addRedaction is called', () => {
      const wrapper = factory();

      wrapper.vm.addRedaction();

      expect(wrapper.emitted('update:value')).toBeTruthy();
      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as AuditPolicy;

      expect(emitted && emitted.additionalRedactions?.length).toBe(1);
      expect(emitted && emitted.additionalRedactions?.[0]).toStrictEqual({
        headers: [],
        paths:   []
      });
    });

    it('should emit update:value when removeRedaction is called', () => {
      const value = {
        additionalRedactions: [
          { headers: ['X-Test'], paths: ['/foo'] },
          { headers: ['Authorization'], paths: ['/bar'] }
        ]
      };
      const wrapper = factory({ value });

      wrapper.vm.removeRedaction(0);

      expect(wrapper.emitted('update:value')).toBeTruthy();
      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as AuditPolicy;

      expect(emitted && emitted.additionalRedactions?.length).toBe(1);
      expect(emitted && emitted.additionalRedactions?.[0]).toStrictEqual({
        headers: ['Authorization'],
        paths:   ['/bar']
      });
    });

    it('should preserve existing prop values when emitting updates', () => {
      const existingValue = { someOtherProp: 'existing' };
      const wrapper = factory({ value: existingValue });

      wrapper.vm.addRedaction();

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();
      const emitted = events && events[0] && events[0][0] as AuditPolicy & { someOtherProp: string };

      expect(emitted && emitted.someOtherProp).toBe('existing');
      expect(emitted && emitted.additionalRedactions).toHaveLength(1);
    });

    it('should remove correct redaction by index', () => {
      const value = {
        additionalRedactions: [
          { headers: ['First'], paths: ['/first'] },
          { headers: ['Second'], paths: ['/second'] },
          { headers: ['Third'], paths: ['/third'] }
        ]
      };
      const wrapper = factory({ value });

      wrapper.vm.removeRedaction(1); // Remove middle item

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();
      const emitted = events && events[0] && events[0][0] as AuditPolicy;

      expect(emitted && emitted.additionalRedactions).toHaveLength(2);
      expect(emitted && emitted.additionalRedactions?.[0]).toStrictEqual({ headers: ['First'], paths: ['/first'] });
      expect(emitted && emitted.additionalRedactions?.[1]).toStrictEqual({ headers: ['Third'], paths: ['/third'] });
    });
  });

  describe('computed properties & logic', () => {
    it('should return correct redactionLabel values', () => {
      const wrapper = factory();

      expect(wrapper.vm.redactionLabel(0)).toBe('Rule 1');
      expect(wrapper.vm.redactionLabel(4)).toBe('Rule 5');
      expect(wrapper.vm.redactionLabel(99)).toBe('Rule 100');
    });

    it('should have reactive redactionLabel computed property', () => {
      const wrapper = factory();
      const labelFn = wrapper.vm.redactionLabel;

      // Test that it returns a function that computes labels
      expect(typeof labelFn).toBe('function');
      expect(labelFn(0)).toBe('Rule 1');
      expect(labelFn(1)).toBe('Rule 2');
    });

    it('should initialize spec reactive ref correctly', () => {
      const wrapper = factory();

      expect(wrapper.vm.spec).toBeDefined();
      expect(Array.isArray(wrapper.vm.spec.additionalRedactions ?? [])).toBe(true);
    });

    it('should merge defaults with props correctly in spec', () => {
      const value = { additionalRedactions: [{ headers: ['Test'], paths: ['/test'] }] };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.additionalRedactions ?? [])).toHaveLength(1);
      expect((wrapper.vm.spec.additionalRedactions ?? [])[0]).toStrictEqual({
        headers: ['Test'],
        paths:   ['/test']
      });
    });
  });

  describe('component configuration', () => {
    it('should configure Tabbed component with correct props', () => {
      const wrapper = factory();
      const tabbedComponent = wrapper.findComponent({ name: 'Tabbed' });

      expect(tabbedComponent.exists()).toBe(true);
      expect(tabbedComponent.props('sideTabs')).toBe(true);
      expect(tabbedComponent.props('useHash')).toBe(true);
    });

    it('should show/hide add/remove tabs based on mode', () => {
      const createWrapper = factory({ mode: 'create' });
      const editWrapper = factory({ mode: 'edit' });
      const viewWrapper = factory({ mode: 'view' });

      expect(createWrapper.findComponent({ name: 'Tabbed' }).props('showTabsAddRemove')).toBe(true);
      expect(editWrapper.findComponent({ name: 'Tabbed' }).props('showTabsAddRemove')).toBe(true);
      expect(viewWrapper.findComponent({ name: 'Tabbed' }).props('showTabsAddRemove')).toBe(false);
    });

    it('should bind correct event handlers to Tabbed component', () => {
      const wrapper = factory();
      const tabbedComponent = wrapper.findComponent({ name: 'Tabbed' });

      // Simulate events from Tabbed component
      tabbedComponent.vm.$emit('addTab');
      expect(wrapper.emitted('update:value')).toBeTruthy();

      const value = { additionalRedactions: [{ headers: [], paths: [] }] };
      const wrapperWithData = factory({ value });
      const tabbedWithData = wrapperWithData.findComponent({ name: 'Tabbed' });

      tabbedWithData.vm.$emit('removeTab', 0);
      expect(wrapperWithData.emitted('update:value')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty additionalRedactions array', () => {
      const wrapper = factory({ value: { additionalRedactions: [] } });

      expect((wrapper.vm.spec.additionalRedactions ?? [])).toStrictEqual([]);
      expect(wrapper.findAllComponents({ name: 'Tab' })).toHaveLength(0);
    });

    it('should handle missing additionalRedactions property', () => {
      const wrapper = factory({ value: {} });

      expect((wrapper.vm.spec.additionalRedactions ?? [])).toStrictEqual([]);
    });

    it('should not crash when removing from empty array', () => {
      const wrapper = factory({ value: { additionalRedactions: [] } });

      expect(() => {
        wrapper.vm.removeRedaction(0);
      }).not.toThrow();

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();
      const emitted = events && events[0] && events[0][0] as AuditPolicy;

      expect(emitted && emitted.additionalRedactions).toStrictEqual([]);
    });

    it('should handle out of bounds removal index gracefully', () => {
      const value = { additionalRedactions: [{ headers: ['Test'], paths: ['/test'] }] };
      const wrapper = factory({ value });

      wrapper.vm.removeRedaction(5); // Index out of bounds

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();
      const emitted = events && events[0] && events[0][0] as AuditPolicy;

      expect(emitted && emitted.additionalRedactions).toHaveLength(1); // Should remain unchanged
    });
  });
});
