import { mount, shallowMount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import NamespaceFilter from '@shell/components/nav/NamespaceFilter.vue';
import { NAMESPACE_FILTERS } from '@shell/store/prefs';
import {
  NAMESPACE_FILTER_KINDS,
  NAMESPACE_FILTER_ALL,
  NAMESPACE_FILTER_ALL_SYSTEM,
  NAMESPACE_FILTER_ALL_USER,
} from '@shell/utils/namespace-filter';

const mountWithRealOptions = ({
  dispatch = jest.fn(), preferences = {}, product = {}, customOptions = [], state = reactive({ clusterId: 'local' })
}: { dispatch?: jest.Mock, preferences?: Record<string, string[]>, product?: Record<string, any>, customOptions?: any[], state?: { clusterId: string } } = {}) => shallowMount(NamespaceFilter, {
  global: {
    mocks: {
      $store: {
        getters: {
          'i18n/t': (key: string) => key,
          get clusterId() {
            return state.clusterId;
          },
          currentProduct: {
            inStore: 'cluster', showNamespaceFilter: true, ...product
          },
          currentStore:                     () => '',
          'type-map/optionsFor':            () => ({}),
          'prefs/get':                      (pref: any) => (pref === NAMESPACE_FILTERS ? preferences : undefined),
          'cluster/paginationEnabled':      () => false,
          'cluster/namespaceFilterOptions': () => customOptions,
        },
        dispatch,
        commit: jest.fn(),
      },
      $route:      { params: {} },
      $fetchState: { pending: false },
    },
    directives: {
      'clean-tooltip': () => {},
      shortkey:        () => {},
    },
  }
});

describe('component: NamespaceFilter', () => {
  describe('given namespace select input', () => {
    it('should be visible', () => {
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => [],
        },
        global: { mocks: { $fetchState: { pending: false } } }
      });
      const filter = wrapper.find(`[data-testid="namespaces-filter"]`);

      expect(filter).toBeDefined();
    });

    it('should display no namespace selection', () => {
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => [],
        },
        global: {
          mocks: {
            $store:      { getters: { namespaceFilterMode: () => undefined } },
            $fetchState: { pending: false }
          },
        }
      });
      const element = wrapper.find(`[data-testid="namespaces-values-none"]`).element.textContent;

      expect(element).toContain('nav.ns.all');
    });

    it('should display the default namespace', () => {
      const text = 'special namespace';
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => ([{
            label: text,
            kind:  'special',
          }]),
          isSingleSpecial: () => true
        },
        global: { mocks: { $fetchState: { pending: false } } }
      });

      const element = wrapper.find(`[data-testid="namespaces-values-label"]`).element.textContent;

      expect(element).toContain(text);
    });

    it('should display the selected namespace', () => {
      const text = 'current namespace';
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => [{ label: text }],
        },
        global: {
          mocks: {
            $store:      { getters: { 'i18n/t': () => text, namespaceFilterMode: () => undefined } },
            $fetchState: { pending: false }
          },
        },
      });

      const element = wrapper.find(`[data-testid="namespaces-value-0"]`).element.textContent;

      expect(element).toContain(text);
    });

    it('should display the selected namespace from user preferences if options are available', () => {
      const text = 'my preference';
      const key = 'local';
      const preferences = {
        [key]: [
          `ns://${ text }`
        ]
      };

      jest.spyOn(NamespaceFilter.computed.value, 'set');
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [{
            id:    `ns://${ text }`,
            kind:  'namespace',
            label: text
          }],
          currentProduct: () => undefined,
          key:            () => key,
          value:          () => [{ label: text }]
        },
        global: {
          mocks: {
            $store: {
              getters: {
                'i18n/t':            () => text,
                'prefs/get':         () => preferences,
                namespaceFilterMode: () => undefined,
              },
            },
            $fetchState: { pending: false }
          },
        }
      });

      const element = wrapper.find(`[data-testid="namespaces-value-0"]`).element.textContent;

      expect(element).toContain(text);
    });
  });

  describe('given namespace menu options', () => {
    it('should be opened and displayed on click', async() => {
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => [],
        },
        global: {
          mocks: {
            $store:      { getters: { 'i18n/t': () => '', namespaceFilterMode: () => undefined } },
            $fetchState: { pending: false }
          },
        }
      });
      const dropdown = wrapper.find(`[data-testid="namespaces-dropdown"]`);

      await dropdown.trigger('click');
      const menu = wrapper.find(`[data-testid="namespaces-menu"]`);

      expect(menu).toBeDefined();
    });

    it('should contain no options', async() => {
      const text = '%namespaceFilter.noMatchingOptions%';
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => [],
        },
        global: {
          mocks: {
            $store:      { getters: { 'i18n/t': () => text, namespaceFilterMode: () => undefined } },
            $fetchState: { pending: false }
          },
        }
      });
      const dropdown = wrapper.find(`[data-testid="namespaces-dropdown"]`);

      await dropdown.trigger('click');
      const option = wrapper.find(`[data-testid="namespaces-option-none"]`).element.textContent;

      expect(option).toContain(text);
    });

    it('should contain an option', async() => {
      const text = 'my option';
      const wrapper = mount(NamespaceFilter, {
        computed: {
          options: () => [],
          value:   () => [],
        },
        global: {
          mocks: {
            $store:      { getters: { 'i18n/t': () => text, namespaceFilterMode: () => undefined } },
            $fetchState: { pending: false }
          },
        }
      });

      (wrapper.vm as any).cachedFiltered = [
        {
          kind:  'namespace',
          label: `default-${ text }`,
        },
      ];

      const dropdown = wrapper.find(`[data-testid="namespaces-dropdown"]`);

      await dropdown.trigger('click');
      const option = wrapper.find(`[data-testid="namespaces-option-0"]`).element.textContent;

      expect(option).toContain(text);
    });

    it('should set the option as user preference', async() => {
      const text = 'my option';
      const key = 'my key';
      const value = {
        ids: [text],
        key
      };
      const actionName = 'switchNamespaces';
      const action = jest.fn();

      jest.spyOn(NamespaceFilter.computed.value, 'get').mockReturnValue([]);

      const wrapper = mount(NamespaceFilter, {
        computed: {
          ...NamespaceFilter.computed,
          options:        () => [],
          currentProduct: () => undefined,
          key:            () => key,
        },
        global: {
          mocks: {
            $store: {
              getters:  { 'i18n/t': () => text, namespaceFilterMode: () => undefined },
              dispatch: action
            },
            $fetchState: { pending: false }
          },
        }
      });

      (wrapper.vm as any).cachedFiltered = [
        {
          label:     text,
          key,
          elementId: text,
          id:        text,
          kind:      'namespace',
          enabled:   true,
        },
      ];

      await wrapper.find(`[data-testid="namespaces-dropdown"]`).trigger('click');
      await wrapper.find(`[data-testid="namespaces-option-0"]`).trigger('click');

      expect(action).toHaveBeenCalledWith(actionName, value);
    });

    it.todo('should generate the options based on the Rancher resources');

    it('should offer namespace scoping options only', () => {
      const wrapper = mountWithRealOptions();

      const ids = (wrapper.vm as any).options.map((o: any) => o.id).filter((id: string) => !!id);

      expect(ids).toStrictEqual([NAMESPACE_FILTER_ALL, NAMESPACE_FILTER_ALL_USER, NAMESPACE_FILTER_ALL_SYSTEM]);
      wrapper.unmount();
    });

    it.each([
      ['namespaced://true'],
      ['namespaced://false'],
    ])('should fall back to the default filter when the stored preference %s is no longer an option', async(stored) => {
      const dispatch = jest.fn().mockResolvedValue(undefined);
      const wrapper = mountWithRealOptions({ dispatch, preferences: { local: [stored] } });

      expect((wrapper.vm as any).value).toStrictEqual([]);

      await nextTick();

      expect(dispatch).toHaveBeenCalledWith('switchNamespaces', { ids: [NAMESPACE_FILTER_ALL_USER], key: 'local' });
      wrapper.unmount();
    });

    it('should land on the default when a stale selection is met while another is already held', async() => {
      const dispatch = jest.fn().mockResolvedValue(undefined);
      const state = reactive({ clusterId: 'clusterA' });
      const preferences = { clusterA: [NAMESPACE_FILTER_ALL_USER], clusterB: ['namespaced://true'] };
      const wrapper = mountWithRealOptions({
        dispatch, preferences, state
      });

      expect((wrapper.vm as any).value).toStrictEqual([expect.objectContaining({ id: NAMESPACE_FILTER_ALL_USER })]);

      state.clusterId = 'clusterB';
      await nextTick();

      expect((wrapper.vm as any).value).toStrictEqual([]);

      await nextTick();

      expect(dispatch).toHaveBeenCalledWith('switchNamespaces', { ids: [NAMESPACE_FILTER_ALL_USER], key: 'clusterB' });
      wrapper.unmount();
    });

    it('should not offer the removed options for a product that hides system resources', () => {
      const wrapper = mountWithRealOptions({ product: { hideSystemResources: true } });

      const ids = (wrapper.vm as any).options.map((o: any) => o.id);

      expect(ids).not.toContain('namespaced://true');
      expect(ids).not.toContain('namespaced://false');
      wrapper.unmount();
    });

    it('should leave a product with its own namespace filter options untouched', () => {
      const ownOptions = [{
        id: 'ns://only-mine', kind: NAMESPACE_FILTER_KINDS.NAMESPACE, label: 'only-mine'
      }];
      const wrapper = mountWithRealOptions({ product: { customNamespaceFilter: true }, customOptions: ownOptions });

      expect((wrapper.vm as any).options).toStrictEqual(ownOptions);
      wrapper.unmount();
    });
  });

  describe('given filter input text selection', () => {
    it('should allow text selection by stopping mousedown propagation', async() => {
      const wrapper = mount(NamespaceFilter, {
        computed: {
          filtered: () => [],
          options:  () => [],
          value:    () => [],
        },
        global: {
          mocks: {
            t:           (key: string) => key,
            $store:      { getters: { 'i18n/t': () => '', namespaceFilterMode: () => undefined } },
            $fetchState: { pending: false }
          },
          directives: {
            'clean-tooltip': () => {},
            shortkey:        () => {},
          },
          stubs: { RcButton: { template: '<button><slot /></button>' } },
        }
      });

      // Open the dropdown to reveal the filter input
      const dropdown = wrapper.find('[data-testid="namespaces-dropdown"]');

      await dropdown.trigger('click');

      // Find the filter input
      const filterInput = wrapper.find('.ns-filter-input');

      expect(filterInput.exists()).toBe(true);

      // Trigger mousedown on the filter input and capture the event
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles:    true,
        cancelable: true
      });
      const stopPropagationSpy = jest.spyOn(mousedownEvent, 'stopPropagation');

      filterInput.element.dispatchEvent(mousedownEvent);

      // Verify stopPropagation was called (which allows text selection)
      expect(stopPropagationSpy).toHaveBeenCalledWith();

      // Verify the default was NOT prevented (text selection should work)
      expect(mousedownEvent.defaultPrevented).toBe(false);
    });
  });
});
