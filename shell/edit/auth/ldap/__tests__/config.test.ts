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

    const userLoginFilter = wrapper.find('[data-testid="user-login-filter"]');

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

    const userLoginFilter = wrapper.find('[data-testid="user-login-filter"]');

    const expectedValue = '';

    expect(userLoginFilter.exists()).toBe(true);
    expect(userLoginFilter.element.value).toBe(expectedValue);
    expect(wrapper.vm.model.userLoginFilter).toBeUndefined();
  });
});
