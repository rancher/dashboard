import { shallowMount } from '@vue/test-utils';
import UserRetentionPage from '../index.vue';
import { useStore } from '@shell/composables/useStore';
import { clone } from '@shell/utils/object';

jest.mock('@shell/composables/useStore', () => ({ useStore: jest.fn() }));

type mockedValue = {
  id: string;
  value: string;
}

const mockedValues: mockedValue[] = [
  {
    id:    'user-last-login-default',
    value: '',
  },
  {
    id:    'user-retention-dry-run',
    value: '',
  },
  {
    id:    'user-retention-cron',
    value: '',
  },
  {
    id:    'delete-inactive-user-after',
    value: '',
  },
  {
    id:    'disable-inactive-user-after',
    value: ''
  },
];

const createWrapper = (mockData = mockedValues) => {
  const store = {
    dispatch: jest.fn((_action, { type, id }) => {
      const mock = mockData.find((mock) => id === mock.id);

      if (mock) {
        return Promise.resolve({ id, value: mock.value });
      }

      return Promise.resolve();
    })
  };

  (useStore as jest.Mock).mockReturnValue(store);

  return shallowMount(UserRetentionPage);
};

describe('user.retention/index.vue', () => {
  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    (useStore as jest.Mock).mockClear();
  });

  it('has unchecked disableAfterPeriod and deleteAfterPeriod checkboxes initially', async() => {
    const wrapper = createWrapper();

    // Wait for the next tick and a small timeout to allow for asynchronous updates
    await new Promise((resolve) => setTimeout(resolve, 10));
    await wrapper.vm.$nextTick();

    const disableAfterPeriodCheckbox = wrapper.find('[data-testid="disableAfterPeriod"]');
    const deleteAfterPeriodCheckbox = wrapper.find('[data-testid="deleteAfterPeriod"]');
    const userRetentionCron = wrapper.find('[data-testid="userRetentionCron"]');
    const userRetentionDryRun = wrapper.find('[data-testid="userRetentionDryRun"]');
    const userLastLoginDefault = wrapper.find('[data-testid="userLastLoginDefault"]');

    expect(disableAfterPeriodCheckbox.isVisible()).toBe(true);
    expect(disableAfterPeriodCheckbox.props().value).toBe(false);
    expect(deleteAfterPeriodCheckbox.isVisible()).toBe(true);
    expect(deleteAfterPeriodCheckbox.props().value).toBe(false);
    expect(userRetentionCron.exists()).toBe(false);
    expect(userRetentionDryRun.exists()).toBe(false);
    expect(userLastLoginDefault.exists()).toBe(false);
  });

  it('renders form when `disable-inactive-user-after` has a value', async() => {
    const mockData = clone(mockedValues).map((mock: mockedValue) => {
      if (mock.id === 'disable-inactive-user-after') {
        mock.value = '30d';
      }

      return mock;
    });
    const wrapper = createWrapper(mockData);

    // Wait for the next tick and a small timeout to allow for asynchronous updates
    await new Promise((resolve) => setTimeout(resolve, 10));
    await wrapper.vm.$nextTick();

    const disableAfterPeriodInput = wrapper.find('[data-testid="disableAfterPeriodInput"]');
    const userRetentionCron = wrapper.find('[data-testid="userRetentionCron"]');
    const userRetentionDryRun = wrapper.find('[data-testid="userRetentionDryRun"]');
    const userLastLoginDefault = wrapper.find('[data-testid="userLastLoginDefault"]');

    expect(disableAfterPeriodInput.props().disabled).toBe(false);
    expect(userRetentionCron.isVisible()).toBe(true);
    expect(userRetentionDryRun.isVisible()).toBe(true);
    expect(userLastLoginDefault.isVisible()).toBe(true);
  });
});
