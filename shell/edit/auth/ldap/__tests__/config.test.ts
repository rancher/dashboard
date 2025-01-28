import { mount } from '@vue/test-utils';
import LDAPConfig from '@shell/edit/auth/ldap/config.vue';

describe('lDAP config', () => {
  it('should display searchUsingServiceAccount checkbox', () => {
    const wrapper = mount(LDAPConfig);
    const checkbox = wrapper.find('[data-testid="searchUsingServiceAccount"]');

    expect(checkbox).toBeDefined();
  });
});
