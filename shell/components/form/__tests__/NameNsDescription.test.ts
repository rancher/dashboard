import { mount } from '@vue/test-utils';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import { createStore } from 'vuex';

describe('component: NameNsDescription', () => {
  // Accessing to computed value due code complexity
  it('should map namespaces to options', () => {
    const namespaceName = 'test';
    const store = createStore({
      getters: {
        allowedNamespaces:   () => () => ({ [namespaceName]: true }),
        currentStore:        () => () => 'cluster',
        'cluster/schemaFor': () => jest.fn()
      }
    });
    const result = [
      {
        label: namespaceName,
        value: namespaceName,
      },
    ];
    const wrapper = mount(NameNsDescription, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          metadata:      {}
        },
        mode:    'create',
        cluster: {},
      },
      global: {
        provide: { store },
        mocks:   {
          $store: {
            dispatch: jest.fn(),
            getters:  {
              namespaces: jest.fn(),
              'i18n/t':   jest.fn(),
            },
          },
        },
      },
    });

    expect((wrapper.vm as any).options).toStrictEqual(result);
  });

  it('should emit in case of new namespace', () => {
    const namespaceName = 'test';
    const store = createStore({
      getters: {
        allowedNamespaces:   () => () => ({ [namespaceName]: true }),
        currentStore:        () => () => 'cluster',
        'cluster/schemaFor': () => jest.fn()
      }
    });
    const newNamespaceName = 'bananas';
    const wrapper = mount(NameNsDescription, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          metadata:      {}
        },
        mode: 'create',
      },
      global: {
        provide: { store },
        mocks:   {
          $store: {
            dispatch: jest.fn(),
            getters:  {
              namespaces:                         jest.fn(),
              'customizations/getPreviewCluster': {
                ready:   true,
                isLocal: false,
                badge:   {},
              },
              'i18n/t': jest.fn(),
            },
          },
        },
      },
    });

    (wrapper.vm as any).updateNamespace(newNamespaceName);

    expect(wrapper.emitted().isNamespaceNew?.[0][0]).toBe(true);
  });

  it('should set the namespace using the namespaceKey prop', () => {
    const namespaceName = 'custom-namespace';
    const store = createStore({
      getters: {
        allowedNamespaces:   () => () => ({ [namespaceName]: true }),
        currentStore:        () => () => 'cluster',
        'cluster/schemaFor': () => jest.fn()
      }
    });

    const wrapper = mount(NameNsDescription, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          metadata:      {},
          value:         { metadata: { namespace: namespaceName } }
        },
        mode:         'create',
        namespaceKey: 'value.metadata.namespace',
      },
      global: {
        provide: { store },
        mocks:   {
          $store: {
            dispatch: jest.fn(),
            getters:  {
              namespaces:                         jest.fn(),
              'customizations/getPreviewCluster': {
                ready:   true,
                isLocal: false,
                badge:   {},
              },
              'i18n/t': jest.fn(),
            },
          },
        },
      },
    });

    expect((wrapper.vm as any).namespace).toBe(namespaceName);
  });

  it('renders the name input with the expected value', () => {
    const namespaceName = 'test';
    const store = createStore({
      getters: {
        allowedNamespaces:   () => () => ({ [namespaceName]: true }),
        currentStore:        () => () => 'cluster',
        'cluster/schemaFor': () => jest.fn()
      }
    });
    const wrapper = mount(NameNsDescription, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          metadata:      { name: 'Default' }
        },
        mode: 'create',
      },
      global: {
        provide: { store },
        mocks:   {
          $store: {
            dispatch: jest.fn(),
            getters:  {
              namespaces:                         jest.fn(),
              'customizations/getPreviewCluster': {
                ready:   true,
                isLocal: false,
                badge:   {},
              },
              'i18n/t': jest.fn(),
            },
          },
        },
      },
    });

    const nameInput = wrapper.find('[data-testid="NameNsDescriptionNameInput"]');

    expect(nameInput.element.value).toBe('Default');
  });

  it('sets the name using the nameKey prop', () => {
    const namespaceName = 'test';
    const store = createStore({
      getters: {
        allowedNamespaces:   () => () => ({ [namespaceName]: true }),
        currentStore:        () => () => 'cluster',
        'cluster/schemaFor': () => jest.fn()
      }
    });
    const wrapper = mount(NameNsDescription, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          metadata:      {},
          spec:          { displayName: 'Default' }
        },
        mode:    'create',
        nameKey: 'spec.displayName'
      },
      global: {
        provide: { store },
        mocks:   {
          $store: {
            dispatch: jest.fn(),
            getters:  {
              namespaces:                         jest.fn(),
              'customizations/getPreviewCluster': {
                ready:   true,
                isLocal: false,
                badge:   {},
              },
              'i18n/t': jest.fn(),
            },
          },
        },
      },
    });

    const nameInput = wrapper.find('[data-testid="NameNsDescriptionNameInput"]');

    expect(nameInput.element.value).toBe('Default');
  });
});
