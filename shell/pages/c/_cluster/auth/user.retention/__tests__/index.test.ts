import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import UserRetention from '@shell/pages/c/_cluster/auth/user.retention/index.vue';
import { SETTING } from '@shell/config/settings';

const dispatch = jest.fn((_action: string, { id }: { id: string }) => Promise.resolve({ id, value: settingValues[id] ?? '' }));

const settingValues: Record<string, string> = {
  [SETTING.DISABLE_INACTIVE_USER_AFTER]:   '300h',
  [SETTING.DELETE_INACTIVE_USER_AFTER]:    '400h',
  [SETTING.USER_RETENTION_CRON]:           '0 0 * * *',
  [SETTING.USER_RETENTION_DRY_RUN]:        'false',
  [SETTING.USER_LAST_LOGIN_DEFAULT]:       '',
  [SETTING.AUTH_USER_SESSION_TTL_MINUTES]: '960',
};

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({
    getters: {},
    dispatch,
    commit:  jest.fn(),
  }),
}));

jest.mock('vue-router', () => ({
  ...jest.requireActual('vue-router'),
  useRouter:           () => ({ back: jest.fn(), replace: jest.fn() }),
  onBeforeRouteUpdate: jest.fn(),
}));

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `%${ key }%` }) }));

async function createWrapper(): Promise<VueWrapper<any, any>> {
  const wrapper = mount(UserRetention, {
    global: {
      stubs: {
        UserRetentionHeader: { template: '<div />' },
        Footer:              { template: '<div />' },
        ToggleSwitch:        { template: '<div />' },
        Banner:              { template: '<div />' },
      },
    },
  }) as VueWrapper<any, any>;

  await flushPromises();

  return wrapper;
}

describe('page: user retention', () => {
  afterEach(() => dispatch.mockClear());

  describe('a11y: inactivity period inputs', () => {
    it('should give the two inputs sharing the "Inactivity period" label distinct accessible names', async() => {
      const wrapper = await createWrapper();

      const disableInput = wrapper.find('[data-testid="disableAfterPeriodInput"]');
      const deleteInput = wrapper.find('[data-testid="deleteAfterPeriodInput"]');

      const disableName = disableInput.attributes('aria-label');
      const deleteName = deleteInput.attributes('aria-label');

      expect(disableName).toBe('%user.retention.edit.form.disableAfter.input.labelDisable%');
      expect(deleteName).toBe('%user.retention.edit.form.deleteAfter.input.labelDelete%');
      expect(disableName).not.toBe(deleteName);
    });

    it('should keep the shared visible label on both inputs', async() => {
      const wrapper = await createWrapper();

      const labels = wrapper.findAll('.input-fieldset label').map((label) => label.text());

      expect(labels).toContain('%user.retention.edit.form.disableAfter.input.label%');
      expect(labels).toContain('%user.retention.edit.form.deleteAfter.input.label%');
    });
  });
});
