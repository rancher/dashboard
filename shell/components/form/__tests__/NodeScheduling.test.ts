import { mount } from '@vue/test-utils';
import NodeScheduling from '@shell/components/form/NodeScheduling.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:                () => 'cluster',
            currentProduct:              { inStore: 'cluster' },
            'i18n/t':                    (text: string) => text,
            t:                           (text: string) => text,
            'cluster/paginationEnabled': () => false,
            'cluster/all':               () => ['node-0', 'node-1'],
          },
          dispatch: jest.fn(),
        }
      },
    }
  };
};

describe('component: NodeScheduling', () => {
  const value = { nodeName: 'node-1' };

  it.each([
    _VIEW,
    _CREATE,
    _EDIT
  ])('should show NodeName option', async(mode) => {
    const wrapper = mount(
      NodeScheduling,
      {
        props: {
          mode, loading: false, value
        },
        ...requiredSetup(),
      }
    );

    expect(wrapper.find('[data-testid="node-scheduling-selectNode"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-testid="node-scheduling-nodeSelector"] .vs__selected').text()).toBe(value.nodeName);
  });
});
