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
});
