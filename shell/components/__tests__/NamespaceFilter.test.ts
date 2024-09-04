import { mount } from '@vue/test-utils';
import NamespaceFilter from '@shell/components/nav/NamespaceFilter.vue';

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
  });
});
