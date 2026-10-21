import { nextTick, reactive } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ActionMenuShell from '@shell/components/ActionMenuShell.vue';
import { RcDropdownMenu } from '@components/RcDropdown';

const mockDispatch = jest.fn();
const mockRoute = { name: 'some-route' };
const mockGetters = reactive<Record<string, any>>({});

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({
    getters:  mockGetters,
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
    mockGetters['action-menu/optionsArray'] = [];
    mockGetters['action-menu/resources'] = [];
  });

  describe('options', () => {
    const resource = { id: 'default/nginx' };
    const other = { id: 'default/redis' };
    const ownActions = [{ action: 'edit', label: 'Edit' }];

    it('should show the actions of its resource', async() => {
      const wrapper = shallowMount(ActionMenuShell, { props: { resource } });

      mockGetters['action-menu/resources'] = [resource];
      mockGetters['action-menu/optionsArray'] = ownActions;
      await nextTick();

      expect(wrapper.findComponent(RcDropdownMenu).props('options')).toStrictEqual(ownActions);
    });

    it('should keep its actions when another resource menu opens', async() => {
      const wrapper = shallowMount(ActionMenuShell, { props: { resource } });

      mockGetters['action-menu/resources'] = [resource];
      mockGetters['action-menu/optionsArray'] = ownActions;
      await nextTick();
      mockGetters['action-menu/resources'] = [other];
      mockGetters['action-menu/optionsArray'] = [{ action: 'delete', label: 'Delete' }];
      await nextTick();

      expect(wrapper.findComponent(RcDropdownMenu).props('options')).toStrictEqual(ownActions);
    });
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

  describe('open prop', () => {
    it('should forward open to RcDropdownMenu', () => {
      const wrapper = shallowMount(ActionMenuShell, { props: { open: true } });

      expect(wrapper.findComponent(RcDropdownMenu).props('open')).toBe(true);
    });

    it('should emit update:open when the menu opens or closes', () => {
      const wrapper = shallowMount(ActionMenuShell);

      wrapper.findComponent(RcDropdownMenu).vm.$emit('update:open', true);
      wrapper.findComponent(RcDropdownMenu).vm.$emit('update:open', false);

      expect(wrapper.emitted('update:open')).toStrictEqual([[true], [false]]);
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
