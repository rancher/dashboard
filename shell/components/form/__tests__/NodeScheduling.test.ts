import { mount } from '@vue/test-utils';
import NodeScheduling from '@shell/components/form/NodeScheduling.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store: {
          getters: {
            currentProduct: { inStore: 'cluster' },
            'i18n/t':       (text: string) => text,
            t:              (text: string) => text,
          }
        }
      },
    }
  };
};

describe('component: NodeScheduling', () => {
  const value = { nodeName: 'node-1' };

  const nodes = ['node-0', 'node-1'];

  it.each([
    _VIEW,
    _CREATE,
    _EDIT
  ])('should show NodeName option', (mode) => {
    const wrapper = mount(
      NodeScheduling,
      {
        props: {
          mode, loading: false, value, nodes
        },
        ...requiredSetup(),
      }
    );

    expect(wrapper.find('[data-testid="node-scheduling-selectNode"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-testid="node-scheduling-nodeSelector"]').element.textContent).toContain(value.nodeName);
  });
});
