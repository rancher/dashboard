import { shallowMount } from '@vue/test-utils';
import ActionMenuShell from '@shell/components/ActionMenuShell.vue';
import { RcDropdownMenu } from '@components/RcDropdown';

const mockDispatch = jest.fn();
const mockRoute = { name: 'some-route' };

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({
    getters:  { 'action-menu/optionsArray': [] },
    dispatch: mockDispatch,
  }),
}));

jest.mock('vue-router', () => ({
  ...jest.requireActual('vue-router'),
  useRoute: () => mockRoute,
}));

describe('component: ActionMenuShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('container prop', () => {
    it('should forward the container to RcDropdownMenu', () => {
      const wrapper = shallowMount(ActionMenuShell, { props: { container: 'body' } });

      expect(wrapper.findComponent(RcDropdownMenu).props('container')).toStrictEqual('body');
    });

    it('should not set a container on RcDropdownMenu when none is provided', () => {
      const wrapper = shallowMount(ActionMenuShell);

      expect(wrapper.findComponent(RcDropdownMenu).props('container')).toBeUndefined();
    });
  });

  describe('action-invoked event', () => {
    it('should emit action-invoked when an enabled action is selected', () => {
      const wrapper = shallowMount(ActionMenuShell);
      const action = { action: 'edit', label: 'Edit' };
      const event = new MouseEvent('click');

      wrapper.findComponent(RcDropdownMenu).vm.$emit('select', event, action);

      expect(wrapper.emitted('action-invoked')).toStrictEqual([[{
        action:     'edit',
        actionData: action,
        event,
        route:      mockRoute,
      }]]);
    });

    it('should not emit action-invoked when a disabled action is selected', () => {
      const wrapper = shallowMount(ActionMenuShell);

      wrapper.findComponent(RcDropdownMenu).vm.$emit('select', new MouseEvent('click'), { action: 'edit', disabled: true });

      expect(wrapper.emitted('action-invoked')).toBeUndefined();
    });
  });
});
