import { mount } from '@vue/test-utils';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';

describe('component: NameNsDescription', () => {
  // Accessing to computed value due code complexity
  it.each([
    [['all://user'], ['filtered', 'unfiltered'], 'filtered'],
    [['ns://my-filter'], ['filtered', 'unfiltered'], 'filtered'],
    [['ns://my-filter'], ['filtered', 'unfiltered'], 'filtered'],
    [[], ['filtered', 'unfiltered'], 'unfiltered'],
  ])('should display filtered list of namespaces', (filters, namespaces, filteredNamespaces) => {
    const wrapper = mount(NameNsDescription, {
      propsData: {
        value: {},
        mode:  'create',
      },
      mocks: {
        $store: {
          getters: {
            inStore:             jest.fn(),
            currentCluster:      jest.fn(),
            currentStore:        () => 'cluster',
            'prefs/get':         () => filters,
            'cluster/schemaFor': jest.fn(),
            currentProduct:      jest.fn(),
            'cluster/all':       () => namespaces,
            'i18n/t':            jest.fn()
          },
        },
      }
    });

    expect((wrapper.vm as any).namespaces).toBe(filteredNamespaces);
    // expect((wrapper.vm as any).namespaces[0].label).toBe(filteredNamespaces);
  });
});
