import { shallowMount } from '@vue/test-utils';
import AuthProvidersPrimeNotice from '@shell/components/auth/AuthProvidersPrimeNotice.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { RcButton } from '@components/RcButton';

describe('component: AuthProvidersPrimeNotice', () => {
  it('should point to Rancher Prime for more than one provider', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice);

    expect(wrapper.find('.auth-providers-prime__title').text()).toBe('%authConfig.list.prime.title%');
  });

  it('should explain the single provider limit of community', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice);

    expect(wrapper.findComponent(RichTranslation).props('k')).toBe('authConfig.list.prime.description');
  });

  it('should link to SUSE Rancher Prime', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice);
    const action = wrapper.find('[data-testid="auth-config-prime-notice-action"]');

    expect(action.attributes('href')).toBe('https://www.suse.com/products/rancher/');
    expect(action.attributes('target')).toBe('_blank');
  });

  // Prime already has the feature; the flag being off is what to fix
  it('should point Prime at the feature flag in the title', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice, { props: { prime: true } });

    expect(wrapper.find('.auth-providers-prime__title').text()).toBe('%authConfig.list.primeFlagOff.title%');
  });

  it('should point Prime at the feature flag in the description', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice, { props: { prime: true } });

    expect(wrapper.findComponent(RichTranslation).props('k')).toBe('authConfig.list.primeFlagOff.description');
  });

  it('should take Prime to the feature flags', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice, { props: { prime: true } });

    expect(wrapper.findComponent(RcButton).props('to')).toStrictEqual({
      name:   'c-cluster-product-resource',
      params: {
        cluster: '_', product: 'settings', resource: 'management.cattle.io.feature'
      },
    });
  });
});
