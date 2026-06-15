import { nextTick } from 'vue';
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';

import GitHub from '@shell/edit/auth/github.vue';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

const validClientId = 'github-client-id';
const validClientSecret = 'github-client-secret';
const validAppId = '12345';
const validPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----';
const validTargetUrl = 'https://github.mycompany.com';

const mockGitHubModel = {
  enabled:      false,
  id:           'github',
  clientId:     validClientId,
  clientSecret: validClientSecret,
  hostname:     'github.com',
  tls:          true,
};

const mockGitHubAppModel = {
  ...mockGitHubModel,
  id:         'githubapp',
  appId:      validAppId,
  privateKey: validPrivateKey,
};

const requiredSetup = (modelOverrides = {}, dataOverrides = {}) => ({
  data() {
    return {
      isEnabling:     false,
      editConfig:     false,
      model:          { ...mockGitHubModel, ...modelOverrides },
      serverSetting:  null,
      errors:         [],
      originalModel:  null,
      principals:     [],
      authConfigName: 'github',
      targetType:     'public',
      targetUrl:      '',
      ...dataOverrides,
    } as any;
  },
  global: {
    mocks: {
      $fetchState: { pending: false },
      $store:      {
        getters: {
          currentStore:              () => 'current_store',
          'current_store/schemaFor': jest.fn(),
          'current_store/all':       jest.fn(),
          'i18n/t':                  (val: string) => val,
          'i18n/exists':             jest.fn(),
        },
        dispatch: jest.fn(),
      },
      $route:  { query: { AS: '' }, params: { id: 'github' } },
      $router: { applyQuery: jest.fn() },
    },
  },
  props: {
    value: {},
    mode:  _EDIT,
  },
});

describe('github.vue', () => {
  describe('GitHub provider', () => {
    let wrapper: VueWrapper<any, any>;

    beforeEach(() => {
      wrapper = mount(GitHub, { ...requiredSetup() });
    });

    afterEach(() => {
      wrapper.unmount();
    });

    describe('save button disabled', () => {
      it('when clientId is empty', async() => {
        wrapper.setData({ model: { clientId: '' } });
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });

      it('when clientSecret is empty', async() => {
        wrapper.setData({ model: { clientSecret: '' } });
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });

      it('when both clientId and clientSecret are empty', async() => {
        wrapper.setData({ model: { clientId: '' } });
        wrapper.setData({ model: { clientSecret: '' } });
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });
    });

    describe('save button enabled', () => {
      it('when clientId and clientSecret are filled', async() => {
        await nextTick();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(false);
      });

      it('when provider is already enabled and not editing config', async() => {
        wrapper.setData({ model: { ...mockGitHubModel, enabled: true }, editConfig: false });
        await nextTick();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(false);
      });
    });
  });

  describe('GitHub App provider', () => {
    let wrapper: VueWrapper<any, any>;

    beforeEach(() => {
      wrapper = mount(GitHub, { ...requiredSetup(mockGitHubAppModel) });
    });

    afterEach(() => {
      wrapper.unmount();
    });

    describe('save button disabled', () => {
      it('when appId is empty', async() => {
        wrapper.setData({ model: { appId: '' } });
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });

      it('when privateKey is empty', async() => {
        wrapper.vm.model.privateKey = '';
        wrapper.setData({ model: { privateKey: '' } });
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });
    });

    describe('save button enabled', () => {
      it('when all required fields are filled', async() => {
        await nextTick();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(false);
      });
    });
  });

  describe('GitHub App fields not required for GitHub provider', () => {
    let wrapper: VueWrapper<any, any>;

    beforeEach(() => {
      wrapper = mount(GitHub, { ...requiredSetup() });
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it('save button is enabled even when appId and privateKey are absent', async() => {
      await nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
    });
  });

  describe('private GitHub Enterprise target', () => {
    let wrapper: VueWrapper<any, any>;

    beforeEach(() => {
      wrapper = mount(
        GitHub,
        { ...requiredSetup({}, { targetType: 'private', targetUrl: validTargetUrl }) }
      );
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it('save button is disabled when targetUrl is empty', async() => {
      wrapper.setData({ targetType: 'private', targetUrl: '' });
      await wrapper.vm.validateAllFields();
      await flushPromises();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
    });

    it('save button is enabled when targetUrl is filled', async() => {
      await nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
    });
  });
});
