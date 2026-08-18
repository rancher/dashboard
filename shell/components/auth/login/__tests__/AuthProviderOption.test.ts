import { mount } from '@vue/test-utils';
import AuthProviderOption from '@shell/components/auth/login/AuthProviderOption.vue';
import AuthProviderLogo from '@shell/components/auth/login/AuthProviderLogo.vue';
import { RcTag } from '@components/Pill';
import type { AuthProviderOption as Option } from '@shell/utils/auth-providers';

const option: Option = {
  id:          'okta-corp',
  type:        'oktaProvider',
  key:         'okta',
  category:    'saml',
  name:        'okta-corp',
  description: 'Partners and contractors.',
  meta:        'Okta · SAML',
  icon:        'okta.svg',
  isLocal:     false,
};

// Mounted in full rather than shallow, since what the option renders down to is
// the point: a button the browser puts in the tab order on its own.
const createWrapper = (props: Option = option) => mount(AuthProviderOption, { props: { option: props } });

describe('component: AuthProviderOption', () => {
  it('should be reachable with the tab key', () => {
    const wrapper = createWrapper();

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('tabindex')).toBeUndefined();
  });

  it('should lead with the name the admin gave the config', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.auth-provider-option__name').text()).toBe('okta-corp');
    expect(wrapper.find('.auth-provider-option__description').text()).toBe('Partners and contractors.');
    expect(wrapper.find('.auth-provider-option__meta').text()).toBe('Okta · SAML');
  });

  // Descriptions are the admin's to write, so most configs will not have one.
  it('should close the gap when the config has no description', () => {
    const wrapper = createWrapper({ ...option, description: '' });

    expect(wrapper.find('.auth-provider-option__description').exists()).toBe(false);
    expect(wrapper.find('.auth-provider-option__name').text()).toBe('okta-corp');
  });

  it('should present the vendor and protocol as a tag', () => {
    const wrapper = createWrapper();

    const tag = wrapper.findComponent(RcTag);

    expect(tag.props('type')).toBe('inactive');
    expect(tag.text()).toBe('Okta · SAML');
  });

  it('should show the vendor mark', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(AuthProviderLogo).props('icon')).toBe('okta.svg');
  });

  it('should raise the option when clicked', async() => {
    const wrapper = createWrapper();

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')?.[0]).toStrictEqual([option]);
  });
});
