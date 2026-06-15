import { nextTick } from 'vue';
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';

import LDAPIndex from '@shell/edit/auth/ldap/index.vue';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

const validOpenLdapModel = {
  enabled:                         false,
  servers:                         ['ldap.example.com'],
  port:                            389,
  connectionTimeout:               5000,
  serviceAccountDistinguishedName: 'cn=admin,dc=example,dc=com',
  serviceAccountPassword:          'secretpassword',
  userSearchBase:                  'dc=example,dc=com',
};

const validActiveDirectoryModel = {
  enabled:                false,
  servers:                ['ad.example.com'],
  port:                   389,
  connectionTimeout:      5000,
  serviceAccountUsername: 'DOMAIN\\admin',
  serviceAccountPassword: 'secretpassword',
  userSearchBase:         'dc=example,dc=com',
};

const validUsername = 'testuser';
const validPassword = 'testpassword';

const buildSetup = (type = 'openldap', modelOverride = {}, localDataOverride = {}) => ({
  data() {
    const baseModel = type === 'activedirectory' ? validActiveDirectoryModel : validOpenLdapModel;

    return {
      isEnabling:     false,
      editConfig:     false,
      model:          { ...baseModel, ...modelOverride },
      username:       validUsername,
      password:       validPassword,
      errors:         [],
      serverSetting:  null,
      originalModel:  null,
      principals:     [],
      authConfigName: type,
      ...localDataOverride,
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
        dispatch: jest.fn()
      },
      $route:  { query: { AS: '' }, params: { id: type } },
      $router: { applyQuery: jest.fn() },
    },
  },
  props: {
    value: { ...validOpenLdapModel, ...modelOverride },
    mode:  _EDIT,
  },
});

const mountAndValidate = async(type: string, modelOverride = {}, localDataOverride = {}) => {
  const wrapper = mount(LDAPIndex, buildSetup(type, modelOverride, localDataOverride));

  await wrapper.vm.validateAllFields();
  await flushPromises();

  return wrapper;
};

describe('ldap/index.vue', () => {
  describe('given default valid values (openldap)', () => {
    let wrapper: VueWrapper<any, any>;

    beforeEach(() => {
      wrapper = mount(LDAPIndex, buildSetup());
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it('has "Enable" button enabled when all required fields are filled', async() => {
      await nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
    });

    it('has "Enable" button enabled when provider is already enabled and not editing config', async() => {
      wrapper.setData({ model: { ...validOpenLdapModel, enabled: true }, editConfig: false });
      await nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
    });
  });

  describe('have "Enable" button disabled when required fields are empty', () => {
    it.each([
      ['username', { username: '', password: validPassword }],
      ['password', { username: validUsername, password: '' }],
    ])('given empty %s (test credentials)', async(field, localData) => {
      const wrapper = await mountAndValidate('openldap', {}, localData);
      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
      wrapper.unmount();
    });

    it.each([
      ['serviceAccountDistinguishedName', { serviceAccountDistinguishedName: '' }],
      ['serviceAccountPassword', { serviceAccountPassword: '' }],
      ['userSearchBase', { userSearchBase: '' }],
    ])('given empty %s (config field)', async(field, modelOverride) => {
      const wrapper = await mountAndValidate('openldap', modelOverride);
      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
      wrapper.unmount();
    });
  });

  describe('certificate conditional validation', () => {
    it('is not required when TLS and STARTTLS are disabled', async() => {
      const wrapper = await mountAndValidate('openldap', { tls: false, starttls: false });

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
      wrapper.unmount();
    });

    it('is required and causes button disabled when TLS is enabled and certificate is empty', async() => {
      const wrapper = await mountAndValidate('openldap', {
        tls:         true,
        starttls:    false,
        certificate: '',
      });

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
      wrapper.unmount();
    });

    it('button is enabled when TLS is enabled and certificate is provided', async() => {
      const wrapper = mount(LDAPIndex, buildSetup('openldap', {
        tls:         true,
        starttls:    false,
        certificate: '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----',
      }));

      await nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
      wrapper.unmount();
    });
  });

  describe('service account field conditional validation', () => {
    it('requires serviceAccountDistinguishedName for openldap when empty', async() => {
      const wrapper = await mountAndValidate('openldap', { serviceAccountDistinguishedName: '' });
      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
      wrapper.unmount();
    });

    it('requires serviceAccountUsername for activedirectory when empty', async() => {
      const wrapper = await mountAndValidate('activedirectory', { serviceAccountUsername: '' });
      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
      wrapper.unmount();
    });

    it('button is enabled for activedirectory when serviceAccountUsername is provided', async() => {
      const wrapper = mount(LDAPIndex, buildSetup('activedirectory'));

      await nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
      wrapper.unmount();
    });
  });
});
