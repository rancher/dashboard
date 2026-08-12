import { shallowMount } from '@vue/test-utils';
import AuthProviderList from '@shell/components/auth/login/AuthProviderList.vue';
import AuthProviderOption from '@shell/components/auth/login/AuthProviderOption.vue';
import { RcSeparator } from '@components/RcSeparator';
import type { AuthProviderOption as Option } from '@shell/utils/auth-providers';

jest.mock('vuex', () => {
  return {
    ...jest.requireActual('vuex'),
    useStore: () => ({ getters: { 'i18n/t': (key: string) => key } }),
  };
});

const option = (id: string, isLocal = false): Option => ({
  id,
  type:     isLocal ? 'localProvider' : 'oktaProvider',
  key:      isLocal ? 'local' : 'okta',
  category: isLocal ? '' : 'saml',
  name:     id,
  meta:     isLocal ? 'Username and password' : 'Okta · SAML',
  icon:     '',
  isLocal,
});

const createWrapper = (options: Option[], selectedId: string | null = null) => shallowMount(AuthProviderList, {
  props:  { options, selectedId },
  global: { mocks: { t: (key: string) => key } },
});

describe('component: AuthProviderList', () => {
  it('should offer every provider the page is not already showing', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh'), option('local', true)]);

    const ids = wrapper.findAllComponents(AuthProviderOption).map((o) => o.props('option').id);

    expect(ids).toStrictEqual(['okta-corp', 'gh', 'local']);
  });

  // The selected provider already has the primary button, so repeating it in
  // the list would offer the same choice twice.
  it('should leave out the selected provider', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh'), option('local', true)], 'okta-corp');

    const ids = wrapper.findAllComponents(AuthProviderOption).map((o) => o.props('option').id);

    expect(ids).toStrictEqual(['gh', 'local']);
  });

  // Local swaps the page over to a username and password form, so it sits apart
  // from the external providers rather than among them.
  it('should present local last, behind a separator', () => {
    const wrapper = createWrapper([option('okta-corp'), option('local', true)]);

    const all = wrapper.findAllComponents(AuthProviderOption);

    expect(wrapper.findComponent(RcSeparator).exists()).toBe(true);
    expect(all[all.length - 1].props('option').isLocal).toBe(true);
  });

  it('should omit local when it is not configured', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh')]);

    expect(wrapper.findComponent(RcSeparator).exists()).toBe(false);
    expect(wrapper.findAllComponents(AuthProviderOption).every((o) => !o.props('option').isLocal)).toBe(true);
  });

  it('should not open with a separator when local is all that is left to offer', () => {
    const wrapper = createWrapper([option('okta-corp'), option('local', true)], 'okta-corp');

    expect(wrapper.findComponent(RcSeparator).exists()).toBe(false);
    expect(wrapper.findAllComponents(AuthProviderOption)).toHaveLength(1);
  });

  it('should raise the chosen provider to the page', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh')]);

    wrapper.findAllComponents(AuthProviderOption)[1].vm.$emit('select', option('gh'));

    expect(wrapper.emitted('select')?.[0][0]).toMatchObject({ id: 'gh' });
  });

  it('should name the list for screen readers', () => {
    const wrapper = createWrapper([option('okta-corp')]);

    expect(wrapper.attributes('aria-label')).toBe('login.providers.heading');
  });
});
