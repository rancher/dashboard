import { shallowMount, VueWrapper } from '@vue/test-utils';
import Filters from '../Filters.vue';
import { ComponentPublicInstance } from 'vue';
import { AuditPolicy, FilterRule } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';

// Mock the ID generation to have consistent snapshots
jest.mock('@shell/utils/string', () => ({ generateRandomAlphaString: () => 'test-id-123' }));

interface FiltersComponent extends ComponentPublicInstance {
  spec: AuditPolicy;
  addRow: (key: 'action' | 'requestURI', filters: FilterRule[]) => void;
  updateRow: (key: 'action' | 'requestURI', index: number, value: string) => void;
  defaultAddValue: FilterRule;
}

const defaultProps = {
  value: { filters: [] },
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
      ArrayList:     true,
      LabeledInput:  true,
      LabeledSelect: true
    }
  }
};

function factory(props: Record<string, any> = {}, options: Record<string, any> = {}): VueWrapper<FiltersComponent> {
  return shallowMount(Filters, {
    props: { ...defaultProps, ...props },
    ...globalMocks,
    ...options
  }) as unknown as VueWrapper<FiltersComponent>;
}

describe('component: Filters', () => {
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

    it('should render with view mode', () => {
      const wrapper = factory({ mode: 'view' });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.row.mb-40').exists()).toBe(true);
    });

    it('should render with initial filters data', () => {
      const value = {
        filters: [
          { action: 'allow', requestURI: '/api/v1/pods' },
          { action: 'deny', requestURI: '/api/v1/secrets' }
        ]
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.filters).toHaveLength(2);
    });
  });

  describe('props & state changes', () => {
    it('should handle empty value prop gracefully', () => {
      const wrapper = factory({ value: undefined });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.spec.filters).toStrictEqual([]);
    });

    it('should handle null value prop gracefully', () => {
      const wrapper = factory({ value: null });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.spec.filters).toStrictEqual([]);
    });

    it('should update when mode prop changes', async() => {
      const wrapper = factory({ mode: 'create' });

      expect((wrapper.props() as any).mode).toBe('create');
      await wrapper.setProps({ mode: 'view' });
      expect((wrapper.props() as any).mode).toBe('view');
    });

    it('should merge defaults with provided value', () => {
      const value = {
        filters:    [{ action: 'allow', requestURI: '/custom' }],
        customProp: 'test'
      };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.filters ?? [])).toHaveLength(1);
      expect((wrapper.vm.spec.filters ?? [])[0]).toStrictEqual({ action: 'allow', requestURI: '/custom' });
      expect((wrapper.vm.spec as any).customProp).toBe('test');
    });
  });

  describe('user interaction', () => {
    it('should emit update:value when addRow is called', () => {
      const wrapper = factory();
      const newFilters = [{ action: 'allow', requestURI: '' }];

      wrapper.vm.addRow('action', newFilters);

      expect(wrapper.emitted('update:value')).toBeTruthy();
      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as { filters: FilterRule[] };

      expect(emitted && emitted.filters).toHaveLength(1);
      expect(emitted && emitted.filters[0]).toStrictEqual({
        action:     'allow',
        requestURI: ''
      });
    });

    it('should emit update:value when updateRow is called', () => {
      const value = {
        filters: [
          { action: 'allow', requestURI: '/api/v1/pods' }
        ]
      };
      const wrapper = factory({ value });

      wrapper.vm.updateRow('action', 0, 'deny');

      expect(wrapper.emitted('update:value')).toBeTruthy();
      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as { filters: FilterRule[] };

      expect(emitted && emitted.filters).toHaveLength(1);
      expect(emitted && emitted.filters[0]).toStrictEqual({
        action:     'deny',
        requestURI: '/api/v1/pods'
      });
    });

    it('should preserve existing prop values when emitting updates', () => {
      const existingValue = { someOtherProp: 'existing' };
      const wrapper = factory({ value: existingValue });

      wrapper.vm.addRow('action', [{ action: 'allow', requestURI: '' }]);

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as { someOtherProp?: string; filters: FilterRule[] };

      expect(emitted && emitted.someOtherProp).toBe('existing');
      expect(emitted && emitted.filters).toHaveLength(1);
    });

    it('should update correct filter by index', () => {
      const value = {
        filters: [
          { action: 'allow', requestURI: '/first' },
          { action: 'deny', requestURI: '/second' },
          { action: 'allow', requestURI: '/third' }
        ]
      };
      const wrapper = factory({ value });

      wrapper.vm.updateRow('requestURI', 1, '/updated');

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as { filters: FilterRule[] };

      expect(emitted && emitted.filters).toHaveLength(3);
      expect(emitted && emitted.filters[0]).toStrictEqual({ action: 'allow', requestURI: '/first' });
      expect(emitted && emitted.filters[1]).toStrictEqual({ action: 'deny', requestURI: '/updated' });
      expect(emitted && emitted.filters[2]).toStrictEqual({ action: 'allow', requestURI: '/third' });
    });

    it('should add filters and emit events correctly', () => {
      const wrapper = factory();
      const expectedDefault = { action: 'allow', requestURI: '' };

      // Add first filter
      wrapper.vm.addRow('action', [expectedDefault]);
      expect(wrapper.emitted('update:value')).toHaveLength(1);

      // Add second filter
      wrapper.vm.addRow('action', [expectedDefault, expectedDefault]);
      expect(wrapper.emitted('update:value')).toHaveLength(2);

      // Add third filter
      wrapper.vm.addRow('action', [expectedDefault, expectedDefault, expectedDefault]);
      expect(wrapper.emitted('update:value')).toHaveLength(3);

      // Check that each emission contains the correct filters
      const emissions = wrapper.emitted('update:value');

      expect(emissions && emissions[0] && (emissions[0][0] as any).filters).toHaveLength(1);

      expect(emissions && emissions[1] && (emissions[1][0] as any).filters).toHaveLength(2);

      expect(emissions && emissions[2] && (emissions[2][0] as any).filters).toHaveLength(3);

      expect(emissions && emissions[2] && (emissions[2][0] as any).filters[2]).toStrictEqual(expectedDefault);
    });
  });

  describe('computed properties & logic', () => {
    it('should have defaultAddValue configured correctly', () => {
      const wrapper = factory();

      expect(wrapper.vm.defaultAddValue).toStrictEqual({
        action:     'allow',
        requestURI: ''
      });
    });

    it('should initialize spec reactive ref correctly', () => {
      const wrapper = factory();

      expect(wrapper.vm.spec).toBeDefined();
      expect(Array.isArray(wrapper.vm.spec.filters ?? [])).toBe(true);
    });

    it('should merge defaults with props correctly in spec', () => {
      const value = { filters: [{ action: 'deny', requestURI: '/test' }] };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.filters ?? [])).toHaveLength(1);
      expect((wrapper.vm.spec.filters ?? [])[0]).toStrictEqual({
        action:     'deny',
        requestURI: '/test'
      });
    });
  });

  describe('component configuration', () => {
    it('should configure ArrayList component with correct props', () => {
      const wrapper = factory();
      const arrayListComponent = wrapper.findComponent({ name: 'ArrayList' });

      expect(arrayListComponent.exists()).toBe(true);
      expect((arrayListComponent.props() as any).mode).toBe('create');
      expect((arrayListComponent.props() as any).protip).toBe(false);
    });

    it('should pass correct mode to ArrayList component', () => {
      const createWrapper = factory({ mode: 'create' });
      const editWrapper = factory({ mode: 'edit' });
      const viewWrapper = factory({ mode: 'view' });

      expect((createWrapper.findComponent({ name: 'ArrayList' }).props() as any).mode).toBe('create');
      expect((editWrapper.findComponent({ name: 'ArrayList' }).props() as any).mode).toBe('edit');
      expect((viewWrapper.findComponent({ name: 'ArrayList' }).props() as any).mode).toBe('view');
    });

    it('should bind correct event handlers to ArrayList component', () => {
      const wrapper = factory();
      const arrayListComponent = wrapper.findComponent({ name: 'ArrayList' });

      expect(arrayListComponent.exists()).toBe(true);
      // ArrayList component handles add/remove internally
      expect((arrayListComponent.props() as any).defaultAddValue).toStrictEqual({
        action:     'allow',
        requestURI: ''
      });
    });

    it('should handle filter data correctly', () => {
      const value = { filters: [{ action: 'allow', requestURI: '/test' }] };
      const wrapper = factory({ value });

      // Check that the component initializes with the provided filters
      expect(wrapper.vm.spec.filters).toHaveLength(1);
      expect((wrapper.vm.spec.filters ?? [])[0]).toStrictEqual({ action: 'allow', requestURI: '/test' });

      // Check that the component structure exists
      expect(wrapper.find('.row.mb-40').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ArrayList' }).exists()).toBe(true);
    });

    it('should not render input components when no filters exist', () => {
      const wrapper = factory({ value: { filters: [] } });

      const labeledSelectStubs = wrapper.findAll('labeled-select-stub');
      const labeledInputStubs = wrapper.findAll('labeled-input-stub');

      expect(labeledSelectStubs).toHaveLength(0);
      expect(labeledInputStubs).toHaveLength(0);
    });
  });

  describe('filter data structure', () => {
    it('should handle filter with action property', () => {
      const value = { filters: [{ action: 'allow' }] };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.filters ?? [])[0]?.action).toBe('allow');
    });

    it('should handle filter with requestURI property', () => {
      const value = { filters: [{ requestURI: '/api/v1/namespaces' }] };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.filters ?? [])[0]?.requestURI).toBe('/api/v1/namespaces');
    });

    it('should handle filter with both action and requestURI', () => {
      const value = { filters: [{ action: 'deny', requestURI: '/api/v1/secrets' }] };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.filters ?? [])[0]).toStrictEqual({
        action:     'deny',
        requestURI: '/api/v1/secrets'
      });
    });

    it('should handle multiple filters with different configurations', () => {
      const value = {
        filters: [
          { action: 'allow', requestURI: '/api/v1/pods' },
          { action: 'deny' },
          { requestURI: '/api/v1/configmaps' },
          {}
        ]
      };
      const wrapper = factory({ value });

      expect((wrapper.vm.spec.filters ?? [])).toHaveLength(4);
      expect((wrapper.vm.spec.filters ?? [])[0]).toStrictEqual({ action: 'allow', requestURI: '/api/v1/pods' });
      expect((wrapper.vm.spec.filters ?? [])[1]).toStrictEqual({ action: 'deny' });
      expect((wrapper.vm.spec.filters ?? [])[2]).toStrictEqual({ requestURI: '/api/v1/configmaps' });
      expect((wrapper.vm.spec.filters ?? [])[3]).toStrictEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle empty filters array', () => {
      const wrapper = factory({ value: { filters: [] } });

      expect((wrapper.vm.spec.filters ?? [])).toStrictEqual([]);
      expect(wrapper.findAllComponents({ name: 'Tab' })).toHaveLength(0);
    });

    it('should handle missing filters property', () => {
      const wrapper = factory({ value: {} });

      expect((wrapper.vm.spec.filters ?? [])).toStrictEqual([]);
    });

    it('should handle updateRow with empty filters array', () => {
      const wrapper = factory({ value: { filters: [] } });

      expect(() => {
        wrapper.vm.updateRow('action', 0, 'allow');
      }).not.toThrow();

      const events = wrapper.emitted('update:value');

      expect(events && events[0]).toBeTruthy();

      const emitted = events && events[0] && events[0][0] as { filters: FilterRule[] };

      expect(emitted && emitted.filters).toStrictEqual([{ action: 'allow', requestURI: '' }]);
    });

    it('should handle updateRow with out of bounds index gracefully', () => {
      const value = { filters: [{ action: 'allow', requestURI: '/test' }] };
      const wrapper = factory({ value });

      expect(() => {
        wrapper.vm.updateRow('action', 5, 'deny'); // Index out of bounds
      }).not.toThrow();
    });

    it('should handle invalid filter data gracefully', () => {
      const value = {
        filters: [
          null,
          undefined,
          { action: 'invalid' },
          { requestURI: '' },
          { extraProp: 'ignored' }
        ]
      };
      const wrapper = factory({ value });

      expect(wrapper.vm.spec.filters).toHaveLength(5);
      expect(() => wrapper.vm.addRow('action', [{ action: 'allow', requestURI: '' }])).not.toThrow();
    });

    it('should handle filter modifications through reactive refs', () => {
      const originalFilter = { action: 'allow', requestURI: '/test' };
      const value = { filters: [originalFilter] };
      const wrapper = factory({ value });

      // Verify the filter is accessible in the component
      expect((wrapper.vm.spec.filters ?? [])[0]).toBeDefined();
      expect((wrapper.vm.spec.filters ?? [])[0]?.action).toBe('allow');

      // Modify the filter through the component
      if ((wrapper.vm.spec.filters ?? [])[0]) {
        (wrapper.vm.spec.filters ?? [])[0].action = 'deny';
      }

      // Verify the component state reflects the change
      expect((wrapper.vm.spec.filters ?? [])[0]?.action).toBe('deny');
    });
  });
});
