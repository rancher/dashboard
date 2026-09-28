import { ref } from 'vue';
import { mount, shallowMount } from '@vue/test-utils';
import NotificationHeader from '@shell/components/nav/NotificationCenter/NotificationHeader.vue';
import { defaultContext } from '@components/RcDropdown/types';

const buildStore = (unreadCount = 1) => {
  const dispatch = jest.fn();
  const store = {
    dispatch,
    getters: { 'notifications/unreadCount': unreadCount },
  };

  return { store, dispatch };
};

const buildGlobal = (store: any) => ({
  provide: {
    store,
    dropdownContext: { ...defaultContext, dropdownItems: ref<HTMLElement[]>([]) },
  },
  mocks: { $store: store },
});

jest.mock('vuex', () => ({ useStore: () => (globalThis as any).__testStore }));

describe('component: NotificationHeader', () => {
  afterEach(() => {
    (globalThis as any).__testStore = undefined;
  });

  it('renders the mark all read action when there are unread notifications', () => {
    const { store } = buildStore(3);

    (globalThis as any).__testStore = store;

    const wrapper = shallowMount(NotificationHeader, { global: buildGlobal(store) });

    expect(wrapper.find('[data-testid="notifications-center-markall-read"]').exists()).toBe(true);
  });

  it('hides the mark all read action when there are no unread notifications', () => {
    const { store } = buildStore(0);

    (globalThis as any).__testStore = store;

    const wrapper = shallowMount(NotificationHeader, { global: buildGlobal(store) });

    expect(wrapper.find('[data-testid="notifications-center-markall-read"]').exists()).toBe(false);
  });

  it('dispatches notifications/markAllRead when clicked', async() => {
    const { store, dispatch } = buildStore(2);

    (globalThis as any).__testStore = store;

    const wrapper = mount(NotificationHeader, { global: buildGlobal(store) });

    await wrapper.find('[data-testid="notifications-center-markall-read"]').trigger('click');

    expect(dispatch).toHaveBeenCalledWith('notifications/markAllRead');
  });

  // Regression test for https://github.com/rancher/dashboard/issues/16923
  // "Mark all as read" was originally an <a href="#"> which, on click, navigated
  // to "#" and stripped any existing URL hash fragment (e.g. #pod). Rendering it
  // as a <button> (via RcButton) removes the default navigation behavior entirely,
  // so the URL hash is preserved and extensions scoped via LocationConfig.hash
  // continue to match after activation.
  it('renders mark all read as a <button> so activating it cannot strip the URL hash', () => {
    const { store } = buildStore(2);

    (globalThis as any).__testStore = store;

    const wrapper = mount(NotificationHeader, { global: buildGlobal(store) });
    const markAll = wrapper.find('[data-testid="notifications-center-markall-read"]');

    expect(markAll.element.tagName).toBe('BUTTON');
    expect(markAll.attributes('href')).toBeUndefined();
  });
});
