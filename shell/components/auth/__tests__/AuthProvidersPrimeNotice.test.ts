import { shallowMount } from '@vue/test-utils';
import AuthProvidersPrimeNotice from '@shell/components/auth/AuthProvidersPrimeNotice.vue';

describe('component: AuthProvidersPrimeNotice', () => {
  it('should point to Rancher Prime for more than one provider', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice);

    expect(wrapper.find('.auth-providers-prime__title').text()).toBe('%authConfig.list.prime.title%');
  });

  it('should explain the single provider limit of community', () => {
    const wrapper = shallowMount(AuthProvidersPrimeNotice);

    expect(wrapper.find('.auth-providers-prime__description').text()).toBe('%authConfig.list.prime.description%');
  });
});
