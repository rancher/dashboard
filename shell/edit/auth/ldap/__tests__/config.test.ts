import { mount } from '@vue/test-utils';
import LDAPConfig from '@shell/edit/auth/ldap/config.vue';

describe('lDAP config', () => {
  it.each([
    'openldap', 'freeipa'
  ])('should display searchUsingServiceAccount checkbox if type %p', (type) => {
    const wrapper = mount(LDAPConfig, {
      propsData: {
        value: {},
        type,
      }
    });
    const checkbox = wrapper.find('[data-testid="searchUsingServiceAccount"]');

    expect(checkbox).toBeDefined();
  });
});
