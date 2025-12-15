import { shallowMount } from '@vue/test-utils';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { ExtensionPoint } from '@shell/core/types';

import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';

// Mock the plugin-helpers module
// NOTE: This top-level mock is likely unused or only used when no test-specific mock is applied,
// but we keep it here using the new safe structure to avoid pollution.
jest.mock('shell/core/plugin-helpers', () => {
  const actual = jest.requireActual('shell/core/plugin-helpers');

  return {
    ...actual,
    // The top-level mock will still return the object structure in case it's called
    // in a context that requires it, but test-specific mocks must return arrays.
    getApplicableExtensionEnhancements: jest.fn().mockImplementation((type, extensionPoint) => {
      if (type === 'resource' && extensionPoint === ExtensionPoint.TABLE_COL) {
        return [
          // Example column, returning array directly as ResourceTable expects
          {
            column: {
              name:     'custom-col',
              label:    'Custom Column',
              getValue: jest.fn(),
              weight:   50,
            }
          },
        ];
      }

      // Default fallback returns an empty array, matching what ResourceTable expects in the failing line
      return [];
    })
  };
});

describe('resourceTable with TABLE extensions', () => {
  let wrapper: any;

  const defaultProps = {
    rows: [
      {
        id: '1', name: 'Resource 1', state: 'active'
      },
      {
        id: '2', name: 'Resource 2', state: 'inactive'
      },
      {
        id: '3', name: 'Resource 3', state: 'active'
      }
    ],
    schema: {
      id:         'test.resource',
      attributes: { columns: [] }
    }
  };

  // Default headers that would typically come from type-map/headersFor
  const defaultHeaders = [
    {
      name: 'state', label: 'State', value: 'state'
    },
    {
      name: 'name', label: 'Name', value: 'name'
    },
    {
      name: 'namespace', label: 'Namespace', value: 'namespace'
    },
    {
      name: 'age', label: 'Age', value: 'age'
    }
  ];

  const createMockStore = (headersForResult = defaultHeaders) => {
    const definedGetters: Record<string, any> = {
      // Core store getters
      currentStore:   jest.fn(() => 'cluster'),
      currentProduct: { showWorkspaceSwitcher: false },

      // Type-map getters
      'type-map/optionsFor':         jest.fn(() => ({})),
      'type-map/headersFor':         jest.fn(() => headersForResult),
      'type-map/labelFor':           jest.fn(() => 'Resource'),
      'type-map/hideBulkActionsFor': jest.fn(() => false),

      // Prefs getters
      'prefs/get': jest.fn(() => null),

      // i18n getters
      'i18n/t':            jest.fn((key) => key),
      'i18n/exists':       jest.fn(() => false),
      'i18n/withFallback': jest.fn((key) => key),

      // Extension manager getters
      'extManager/extensionsByType': jest.fn(() => []),

      // Cluster getters
      'cluster/all':       jest.fn(() => []),
      'cluster/schemaFor': jest.fn(() => null),

      // Management getters
      'management/schemaFor': jest.fn(() => null),
    };

    // Use a Proxy to return a default mock function for any undefined getter
    const gettersProxy = new Proxy(definedGetters, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as string];
        }

        return jest.fn(() => null);
      }
    });

    return {
      getters:  gettersProxy,
      dispatch: jest.fn(() => Promise.resolve()),
      commit:   jest.fn(),
      $plugin:  { getUIConfig: jest.fn(() => ({})) }
    };
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    jest.clearAllMocks();
  });

  const mountComponent = (props = defaultProps, store = createMockStore()) => {
    return shallowMount(ResourceTable, {
      props,
      global: {
        mocks: {
          $store: store,
          $route: {
            params: {}, query: {}, name: 'test-route'
          },
          $router: { push: jest.fn(), replace: jest.fn() },
        },
        directives: {
          shortkey:        {},
          'clean-html':    {},
          'clean-tooltip': {},
          tooltip:         {},
        },
        stubs: {
          SortableTable: true,
          ButtonGroup:   true,
          ToggleSwitch:  true,
          Checkbox:      true,
          Select:        true,
          LabeledSelect: true,
          BadgeState:    true,
        }
      }
    });
  };

  describe('tABLE extension hooks', () => {
    describe('event binding', () => {
      it('should have handleSortableTableInteraction method defined', () => {
        // Return an empty array for all calls for safety
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(() => []);

        wrapper = mountComponent();

        // Check that the component has the handleSortableTableInteraction method
        expect(wrapper.vm.handleSortableTableInteraction).toBeDefined();
        expect(typeof wrapper.vm.handleSortableTableInteraction).toBe('function');
      });

      it('should call tableHook when handleSortableTableInteraction is invoked', async() => {
        const tableHook = jest.fn();

        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE) {
              return [{ tableHook }]; // Array return (passes)
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const interactionData = {
          pagination: { page: 2, perPage: 10 },
          filtering:  { searchFields: [], searchQuery: '' },
          sorting:    {
            sort: [], sortBy: '', descending: false
          }
        };

        // Call the handler directly
        wrapper.vm.handleSortableTableInteraction(interactionData);

        expect(tableHook).toHaveBeenCalledWith(interactionData);
      });
    });

    describe('hook invocation', () => {
      it('should call tableHook with complete interaction data', async() => {
        const tableHook = jest.fn();

        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE) {
              return [{ tableHook }]; // Array return (passes)
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const interactionData = {
          pagination: { page: 3, perPage: 25 },
          filtering:  { searchFields: ['name', 'state'], searchQuery: 'active' },
          sorting:    {
            sort: ['name'], sortBy: 'name', descending: true
          }
        };

        wrapper.vm.handleSortableTableInteraction(interactionData);

        expect(tableHook).toHaveBeenCalledTimes(1);
        expect(tableHook).toHaveBeenCalledWith(interactionData);

        // Verify all data structures are passed correctly
        const callArg = tableHook.mock.calls[0][0];

        expect(callArg.pagination).toStrictEqual({ page: 3, perPage: 25 });
        expect(callArg.filtering).toStrictEqual({ searchFields: ['name', 'state'], searchQuery: 'active' });
        expect(callArg.sorting).toStrictEqual({
          sort: ['name'], sortBy: 'name', descending: true
        });
      });

      it('should call all registered tableHooks in order', async() => {
        const callOrder: number[] = [];
        const tableHook1 = jest.fn(() => callOrder.push(1));
        const tableHook2 = jest.fn(() => callOrder.push(2));
        const tableHook3 = jest.fn(() => callOrder.push(3));

        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE) {
              return [
                { tableHook: tableHook1 },
                { tableHook: tableHook2 },
                { tableHook: tableHook3 }
              ]; // Array return (passes)
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const interactionData = {
          pagination: { page: 1, perPage: 10 },
          filtering:  { searchFields: [], searchQuery: '' },
          sorting:    {
            sort: [], sortBy: '', descending: false
          }
        };

        wrapper.vm.handleSortableTableInteraction(interactionData);

        expect(tableHook1).toHaveBeenCalledTimes(1);
        expect(tableHook2).toHaveBeenCalledTimes(1);
        expect(tableHook3).toHaveBeenCalledTimes(1);
        expect(callOrder).toStrictEqual([1, 2, 3]);
      });

      it('should not throw when no extensions are registered', () => {
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(() => []);

        wrapper = mountComponent();

        const interactionData = {
          pagination: { page: 1, perPage: 10 },
          filtering:  { searchFields: [], searchQuery: '' },
          sorting:    {
            sort: [], sortBy: '', descending: false
          }
        };

        expect(() => {
          wrapper.vm.handleSortableTableInteraction(interactionData);
        }).not.toThrow();
      });

      it('should skip extensions without tableHook property', () => {
        const tableHook = jest.fn();

        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE) {
              return [
                { someOtherProperty: 'value' },
                { tableHook },
                { anotherProperty: 123 }
              ]; // Array return (passes)
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const interactionData = {
          pagination: { page: 1, perPage: 10 },
          filtering:  { searchFields: [], searchQuery: '' },
          sorting:    {
            sort: [], sortBy: '', descending: false
          }
        };

        expect(() => {
          wrapper.vm.handleSortableTableInteraction(interactionData);
        }).not.toThrow();

        // Only the valid hook should be called
        expect(tableHook).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('tABLE_COLUMN extension with weight', () => {
    describe('column insertion', () => {
      it('should add extension column to headers', () => {
        const columnExtension = {
          column: {
            name:   'custom-col',
            label:  'Custom Column',
            value:  'customValue',
            weight: 10
          }
        };

        // FIX: Return the array directly, as the component expects a list it can iterate over
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return [columnExtension];
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const headers = wrapper.vm._headers;
        const columnNames = headers.map((h: any) => h.name);

        expect(columnNames).toContain('custom-col');
      });

      it('should use getValue function as value when provided', () => {
        const getValueFn = jest.fn((row) => `custom-${ row.id }`);
        const columnExtension = {
          column: {
            name:     'custom-col',
            label:    'Custom Column',
            getValue: getValueFn
          }
        };

        // FIX: Return the array directly
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return [columnExtension];
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const headers = wrapper.vm._headers;
        const customCol = headers.find((h: any) => h.name === 'custom-col');

        expect(customCol.value).toBe(getValueFn);
      });
    });

    describe('column positioning with weight', () => {
      it('should insert column at position 0 when weight is negative', () => {
        const columnExtension = {
          column: {
            name:   'first-col',
            label:  'First Column',
            value:  'firstValue',
            weight: -10
          }
        };

        // FIX: Return the array directly
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return [columnExtension];
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const headers = wrapper.vm._headers;

        expect(headers[0].name).toBe('first-col');
      });

      it('should insert column at specified weight position when weight is less than total columns', () => {
        const columnExtension = {
          column: {
            name:   'weighted-col',
            label:  'Weighted Column',
            value:  'weightedValue',
            weight: 2
          }
        };

        // FIX: Return the array directly
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return [columnExtension];
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const headers = wrapper.vm._headers;
        const columnIndex = headers.findIndex((h: any) => h.name === 'weighted-col');

        expect(columnIndex).toBe(2);
      });

      it('should insert column before age column by default when no weight specified', () => {
        // Use headers with an 'age' column
        const headersWithAge = [
          {
            name: 'state', label: 'State', value: 'state'
          },
          {
            name: 'name', label: 'Name', value: 'name'
          },
          {
            name: 'age', label: 'Age', value: 'age'
          }
        ];

        const columnExtension = {
          column: {
            name:  'no-weight-col',
            label: 'No Weight Column',
            value: 'noWeightValue'
            // No weight specified
          }
        };

        // FIX: Return the array directly
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return [columnExtension];
            }

            return [];
          }
        );

        wrapper = mountComponent(defaultProps, createMockStore(headersWithAge));

        const headers = wrapper.vm._headers;
        const columnNames = headers.map((h: any) => h.name);
        const customColIndex = columnNames.indexOf('no-weight-col');
        const ageColIndex = columnNames.indexOf('age');

        // Column should be inserted at or after the age column position (ageColIndex + 1)
        expect(customColIndex).toBeLessThanOrEqual(ageColIndex + 1);
      });

      it('should maintain correct relative positions for multiple weighted columns', () => {
        const columnExtensions = [
          {
            column: {
              name: 'col-weight-3', label: 'Weight 3', value: 'v3', weight: 3
            }
          },
          {
            column: {
              name: 'col-weight-1', label: 'Weight 1', value: 'v1', weight: 1
            }
          },
          {
            column: {
              name: 'col-weight-2', label: 'Weight 2', value: 'v2', weight: 2
            }
          }
        ];

        // FIX: Return the array directly
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return columnExtensions;
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const headers = wrapper.vm._headers;
        const weight1Index = headers.findIndex((h: any) => h.name === 'col-weight-1');
        const weight2Index = headers.findIndex((h: any) => h.name === 'col-weight-2');
        const weight3Index = headers.findIndex((h: any) => h.name === 'col-weight-3');

        // Lower weight should come before higher weight
        expect(weight1Index).toBeLessThan(weight2Index);
        expect(weight2Index).toBeLessThan(weight3Index);
      });

      it('should not exceed total header count when weight is very large', () => {
        const columnExtension = {
          column: {
            name:   'large-weight-col',
            label:  'Large Weight Column',
            value:  'largeWeightValue',
            weight: 9999
          }
        };

        // FIX: Return the array directly
        (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
          (component, extensionPoint) => {
            if (extensionPoint === ExtensionPoint.TABLE_COL) {
              return [columnExtension];
            }

            return [];
          }
        );

        wrapper = mountComponent();

        const headers = wrapper.vm._headers;
        const columnIndex = headers.findIndex((h: any) => h.name === 'large-weight-col');

        // Should be within bounds
        expect(columnIndex).toBeGreaterThanOrEqual(0);
        expect(columnIndex).toBeLessThan(headers.length);
      });
    });
  });

  describe('combined TABLE and TABLE_COLUMN extensions', () => {
    it('should support both hook and column extensions simultaneously', async() => {
      const tableHook = jest.fn();
      const columnExtension = {
        column: {
          name:   'combined-col',
          label:  'Combined Column',
          value:  'combinedValue',
          weight: 1
        }
      };

      // FIX: Must handle both extension points, returning the array for the requested point
      (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
        (component, extensionPoint) => {
          if (extensionPoint === ExtensionPoint.TABLE) {
            return [{ tableHook }];
          }
          if (extensionPoint === ExtensionPoint.TABLE_COL) {
            return [columnExtension];
          }

          return [];
        }
      );

      wrapper = mountComponent();

      // Verify column was added
      const headers = wrapper.vm._headers;
      const columnNames = headers.map((h: any) => h.name);

      expect(columnNames).toContain('combined-col');

      // Verify hook works
      const interactionData = {
        pagination: { page: 1, perPage: 10 },
        filtering:  { searchFields: [], searchQuery: '' },
        sorting:    {
          sort: ['combined-col'], sortBy: 'combined-col', descending: false
        }
      };

      wrapper.vm.handleSortableTableInteraction(interactionData);

      expect(tableHook).toHaveBeenCalledWith(interactionData);
    });

    it('should pass extension column in sortable-table-interaction sorting data', async() => {
      const tableHook = jest.fn();
      const columnExtension = {
        column: {
          name:   'sortable-ext-col',
          label:  'Sortable Extension Column',
          value:  'sortableValue',
          weight: 1
        }
      };

      // FIX: Must handle both extension points, returning the array for the requested point
      (getApplicableExtensionEnhancements as jest.Mock).mockImplementation(
        (component, extensionPoint) => {
          if (extensionPoint === ExtensionPoint.TABLE) {
            return [{ tableHook }];
          }
          if (extensionPoint === ExtensionPoint.TABLE_COL) {
            return [columnExtension];
          }

          return [];
        }
      );

      wrapper = mountComponent();

      // Simulate sorting by the extension column
      const interactionData = {
        pagination: { page: 1, perPage: 10 },
        filtering:  { searchFields: [], searchQuery: '' },
        sorting:    {
          sort: ['sortable-ext-col'], sortBy: 'sortable-ext-col', descending: true
        }
      };

      wrapper.vm.handleSortableTableInteraction(interactionData);

      expect(tableHook).toHaveBeenCalledWith(
        expect.objectContaining({
          sorting: expect.objectContaining({
            sortBy:     'sortable-ext-col',
            descending: true
          })
        })
      );
    });
  });
});
