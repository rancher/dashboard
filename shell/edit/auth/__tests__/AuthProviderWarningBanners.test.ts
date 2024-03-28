import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners.vue';
import { mount } from '@vue/test-utils';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('component: AuthProviderWarningBanners.vue', () => {
  const wrapper = mount(AuthProviderWarningBanners, {
    mocks:      { $store: { getters: { 'i18n/t': (text: string) => text } } },
    propsData:  { tArgs: { provider: 'Any Provider', username: 'username' } },
    directives: { cleanHtmlDirective }
  });

  it('should render properly', () => {
    const disabledWarningBanner = wrapper.find('[data-testid="auth-provider-disabled-warning-banner"]');
    const adminPermissionsWarningBanner = wrapper.find('[data-testid="auth-provider-admin-permissions-warning-banner"]');

    expect(disabledWarningBanner.element).toBeDefined();
    expect(adminPermissionsWarningBanner.element).toBeDefined();
  });
});
