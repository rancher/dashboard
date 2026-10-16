import { mount } from '@vue/test-utils';
import LDAPConfig from '@shell/edit/auth/ldap/config.vue';

describe('lDAP config', () => {
  it('updates user login filter when value is entered', async() => {
    const wrapper = mount(
      LDAPConfig,
      {
        props: {
          value: {},
          type:  'openldap',
        }
      });

    const userLoginFilter = wrapper.find<HTMLInputElement>('[data-testid="user-login-filter"]');

    await userLoginFilter.setValue('Test Filter');

    const expectedValue = 'Test Filter';

    expect(userLoginFilter.exists()).toBe(true);
    expect(userLoginFilter.element.value).toBe(expectedValue);
    expect(wrapper.vm.model.userLoginFilter).toBe(expectedValue);
  });

  it('defaults to undefined for user login filter', () => {
    const wrapper = mount(
      LDAPConfig,
      {
        props: {
          value: {},
          type:  'openldap',
        }
      });

    const userLoginFilter = wrapper.find<HTMLInputElement>('[data-testid="user-login-filter"]');

    const expectedValue = '';

    expect(userLoginFilter.exists()).toBe(true);
    expect(userLoginFilter.element.value).toBe(expectedValue);
    expect(wrapper.vm.model.userLoginFilter).toBeUndefined();
  });

  it.each([
    'openldap', 'freeipa'
  ])('should display searchUsingServiceAccount checkbox if type %p', (type) => {
    const wrapper = mount(LDAPConfig, {
      props: {
        value: {},
        type,
      }
    });
    const checkbox = wrapper.find('[data-testid="searchUsingServiceAccount"]');

    expect(checkbox).toBeDefined();
  });
});

describe('lDAP config principal identifier attributes', () => {
  const mountConfig = (type: string, isCreate: boolean, value: Record<string, unknown> = {}) => mount(LDAPConfig, {
    props: {
      value,
      type,
      isCreate,
    }
  });

  it.each([
    'openldap', 'freeipa', 'activedirectory', 'shibboleth', 'okta'
  ])('renders both identifier attribute inputs for type %p', (type) => {
    const wrapper = mountConfig(type, true);

    expect(wrapper.find('[data-testid="ldap-user-id-attribute"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ldap-group-id-attribute"]').exists()).toBe(true);
  });

  it('binds the identifier attributes to the model', async() => {
    const wrapper = mountConfig('activedirectory', true);

    await wrapper.find<HTMLInputElement>('[data-testid="ldap-user-id-attribute"]').setValue('sAMAccountName');
    await wrapper.find<HTMLInputElement>('[data-testid="ldap-group-id-attribute"]').setValue('objectSid');

    expect(wrapper.vm.model.userIDAttribute).toBe('sAMAccountName');
    expect(wrapper.vm.model.groupIDAttribute).toBe('objectSid');
  });

  it('leaves the identifier attributes unset by default', () => {
    const wrapper = mountConfig('openldap', true);

    expect(wrapper.vm.model.userIDAttribute).toBeUndefined();
    expect(wrapper.vm.model.groupIDAttribute).toBeUndefined();
  });

  it('allows editing the identifier attributes before the provider is enabled', () => {
    const wrapper = mountConfig('openldap', true);

    expect(wrapper.find<HTMLInputElement>('[data-testid="ldap-user-id-attribute"]').element.disabled).toBe(false);
    expect(wrapper.find<HTMLInputElement>('[data-testid="ldap-group-id-attribute"]').element.disabled).toBe(false);
  });

  it.each([
    'openldap', 'freeipa', 'activedirectory'
  ])('locks the identifier attributes once the %p provider is enabled', (type) => {
    const wrapper = mountConfig(type, false, { userIDAttribute: 'uid', groupIDAttribute: 'cn' });

    const user = wrapper.find<HTMLInputElement>('[data-testid="ldap-user-id-attribute"]');
    const group = wrapper.find<HTMLInputElement>('[data-testid="ldap-group-id-attribute"]');

    expect(user.element.disabled).toBe(true);
    expect(user.element.value).toBe('uid');
    expect(group.element.disabled).toBe(true);
    expect(group.element.value).toBe('cn');
  });

  it.each([
    'shibboleth', 'okta'
  ])('keeps the identifier attributes editable on the enabled %p provider', (type) => {
    const wrapper = mountConfig(type, false, { userIDAttribute: 'uid', groupIDAttribute: 'cn' });

    expect(wrapper.find<HTMLInputElement>('[data-testid="ldap-user-id-attribute"]').element.disabled).toBe(false);
    expect(wrapper.find<HTMLInputElement>('[data-testid="ldap-group-id-attribute"]').element.disabled).toBe(false);
  });
});
