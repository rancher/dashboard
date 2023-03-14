import { mount } from '@vue/test-utils';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';

describe('component: NameNsDescription', () => {
  // Accessing to computed value due code complexity
  it('should map namespaces to options', () => {
    const namespaceName = 'test';
    const result = [{
      label: namespaceName,
      value: namespaceName
    }];
    const wrapper = mount(NameNsDescription, {
      propsData: {
        value: {},
        mode:  'create',
      },
      mocks: {
        $store: {
          getters: {
            namespaces:          () => ({ [namespaceName]: true }),
            currentStore:        () => 'cluster',
            'cluster/schemaFor': jest.fn(),
            'i18n/t':            jest.fn()
          },
        },
      }
    });

    expect((wrapper.vm as any).options).toStrictEqual(result);
  });
});
