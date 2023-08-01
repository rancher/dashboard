import { mount } from '@vue/test-utils';
import NodeScheduling from '@shell/components/form/NodeScheduling.vue';

describe('component: NodeScheduling', () => {
  it('should not be given nodeAffinity an initial value', () => {
    const wrapper = mount(NodeScheduling, {
      propsData: {
        value: {},
        mode:  'create',
      },
      mocks: {
        $store: {
          getters: {
            'i18n/t':       jest.fn(),
            currentProduct: () => ({ inStore: '' })
          },
        },
      }
    });

    expect(wrapper.vm.nodeAffinity).toStrictEqual({});
  });
});
