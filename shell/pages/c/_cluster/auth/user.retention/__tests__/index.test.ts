import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import UserRetention from '@shell/pages/c/_cluster/auth/user.retention/index.vue';
import Footer from '@shell/components/form/Footer.vue';
import { SETTING } from '@shell/config/settings';

type CachedSetting = { id: string, value: string, save: () => Promise<void> };

const cache: Record<string, CachedSetting> = {};
let rejectedId: string | undefined;
const save = jest.fn((id: string, _value: string) => (id === rejectedId ? Promise.reject(new Error('rejected')) : Promise.resolve()));

const dispatch = jest.fn((action: string, payload: { id?: string, resource?: CachedSetting }) => {
  if (action === 'management/clone') {
    return Promise.resolve({ ...payload.resource });
  }

  if (action === 'management/find') {
    const id = payload.id as string;

    cache[id] = cache[id] || {
      id,
      value: settingValues[id] ?? '',
      save() {
        return save(this.id, this.value);
      },
    };

    return Promise.resolve(cache[id]);
  }

  return Promise.resolve();
});

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

function clickSave(wrapper: VueWrapper<any, any>): Promise<boolean> {
  return new Promise((resolve) => wrapper.findComponent(Footer).vm.$emit('save', resolve));
}

describe('page: user retention', () => {
  afterEach(() => {
    dispatch.mockClear();
    save.mockClear();
    rejectedId = undefined;
    Object.keys(cache).forEach((id) => delete cache[id]);
  });

  describe('saving', () => {
    it('should save every setting with the values entered in the form', async() => {
      const wrapper = await createWrapper();

      await wrapper.find('[data-testid="deleteAfterPeriodInput"]').setValue('500h');
      await clickSave(wrapper);

      expect(save.mock.calls).toStrictEqual([
        [SETTING.DISABLE_INACTIVE_USER_AFTER, '300h'],
        [SETTING.DELETE_INACTIVE_USER_AFTER, '500h'],
        [SETTING.USER_RETENTION_CRON, '0 0 * * *'],
        [SETTING.USER_RETENTION_DRY_RUN, 'false'],
        [SETTING.USER_LAST_LOGIN_DEFAULT, ''],
      ]);
    });

    it('should save the default last login as a date', async() => {
      const wrapper = await createWrapper();

      await wrapper.find('[data-testid="userLastLoginDefault"]').setValue('1704067200000');
      await clickSave(wrapper);

      expect(save).toHaveBeenCalledWith(SETTING.USER_LAST_LOGIN_DEFAULT, '2024-01-01T00:00:00+00:00');
    });

    it('should show the stored value when the page is opened again after the server rejects a save', async() => {
      rejectedId = SETTING.DELETE_INACTIVE_USER_AFTER;
      const wrapper = await createWrapper();

      await wrapper.find('[data-testid="deleteAfterPeriodInput"]').setValue('500h');
      await clickSave(wrapper);
      wrapper.unmount();

      const reopened = await createWrapper();
      const deleteInput = reopened.find('[data-testid="deleteAfterPeriodInput"]').element as HTMLInputElement;

      expect(deleteInput.value).toStrictEqual('400h');
    });

    it.each([
      SETTING.DISABLE_INACTIVE_USER_AFTER,
      SETTING.DELETE_INACTIVE_USER_AFTER,
    ])('should save only the inactivity periods when the server rejects %p', async(id) => {
      rejectedId = id;
      const wrapper = await createWrapper();

      await clickSave(wrapper);

      expect(save.mock.calls.map(([savedId]) => savedId)).toStrictEqual([
        SETTING.DISABLE_INACTIVE_USER_AFTER,
        SETTING.DELETE_INACTIVE_USER_AFTER,
      ]);
    });
  });

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
