import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import Notification from '@shell/components/nav/NotificationCenter/Notification.vue';
import { defaultContext } from '@components/RcDropdown/types';
import { NotificationLevel, StoredNotification } from '@shell/types/notifications';
import { DATE_FORMAT } from '@shell/store/prefs';

const buildStore = () => {
  const store = {
    dispatch: jest.fn(),
    getters:  {
      'notifications/unreadCount': 0,
      'prefs/get':                 (key: string) => (key === DATE_FORMAT ? 'YYYY-MM-DD' : 'HH:mm'),
    },
  };

  return { store };
};

const buildGlobal = (store: any) => ({
  provide: {
    store,
    dropdownContext: { ...defaultContext, dropdownItems: ref<HTMLElement[]>([]) },
  },
  mocks: { $store: store },
});

const buildItem = (created: string): StoredNotification => ({
  id:      'notification-1',
  level:   NotificationLevel.Success,
  title:   'Title',
  read:    false,
  created: new Date(created),
});

jest.mock('vuex', () => ({ useStore: () => (globalThis as any).__testStore }));
jest.mock('vue-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe('component: Notification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-07T11:40:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    (globalThis as any).__testStore = undefined;
  });

  // https://github.com/rancher/dashboard/issues/19374
  it.each([
    ['earlier today', '2026-10-07T00:05:00.000Z', 'notificationCenter.dates.today, 00:05'],
    ['yesterday, less than 24h ago', '2026-10-06T17:04:00.000Z', 'notificationCenter.dates.yesterday, 17:04'],
    ['yesterday, more than 24h ago', '2026-10-06T00:01:00.000Z', 'notificationCenter.dates.yesterday, 00:01'],
    ['two days ago', '2026-10-05T23:59:00.000Z', '2026-10-05, 23:59'],
  ])('labels a notification created %s', (_, created, expected) => {
    const { store } = buildStore();

    (globalThis as any).__testStore = store;

    const wrapper = shallowMount(Notification, { props: { item: buildItem(created) }, global: buildGlobal(store) });

    expect(wrapper.find('.created').text()).toBe(expected);
  });
});
