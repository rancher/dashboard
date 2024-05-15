import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners.vue';
import { mount } from '@vue/test-utils';

describe('component: AuthProviderWarningBanners.vue', () => {
  const wrapper = mount(AuthProviderWarningBanners, {
    mocks:     { $store: { getters: { 'i18n/t': (text: string) => text } } },
    propsData: { tArgs: { provider: 'Any Provider', username: 'username' } }
  });

  it('should render properly', () => {
    const providerDisabledWarningBanner = wrapper.find('[data-testid="auth-provider-disabled-warning-banner"]');
    const adminPermissionsWarningBanner = wrapper.find('[data-testid="auth-provider-admin-permissions-warning-banner"]');

    expect(providerDisabledWarningBanner.element).toBeDefined();
    expect(providerDisabledWarningBanner.isVisible()).toBe(true);
    expect(adminPermissionsWarningBanner.element).toBeDefined();
    expect(adminPermissionsWarningBanner.isVisible()).toBe(true);
  });
});
