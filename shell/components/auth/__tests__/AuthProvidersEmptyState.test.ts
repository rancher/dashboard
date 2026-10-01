import { mount, RouterLinkStub } from '@vue/test-utils';
import AuthProvidersEmptyState from '@shell/components/auth/AuthProvidersEmptyState.vue';
import { RcButton } from '@components/RcButton';

const createWrapper = () => mount(AuthProvidersEmptyState, { global: { stubs: { RouterLink: RouterLinkStub } } });

describe('component: AuthProvidersEmptyState', () => {
  it('should explain that only local accounts can log in', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.auth-providers-empty__title').text()).toBe('%authConfig.list.empty.title%');
    expect(wrapper.find('.auth-providers-empty__description').text()).toBe('%authConfig.list.empty.description%');
  });

  // The picker is a modal now, so the page owns opening it rather than the CTA
  // navigating anywhere.
  it('should ask the page to open the provider picker', async() => {
    const wrapper = createWrapper();

    const cta = wrapper.findComponent(RcButton);

    expect(cta.attributes('data-testid')).toBe('auth-config-create');

    await cta.trigger('click');

    expect(wrapper.emitted('create')).toHaveLength(1);
  });

  // The docs live off-site, so the link has to be safe to open in a new tab.
  it('should open the documentation without handing over the opener', () => {
    const wrapper = createWrapper();

    const link = wrapper.find('.auth-providers-empty__link');

    expect(link.attributes('href')).toBe('%authConfig.list.docsUrl%');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer nofollow');
  });
});
