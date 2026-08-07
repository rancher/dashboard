import { shallowMount } from '@vue/test-utils';
import AuthProviderSelect from '@shell/components/auth/login/AuthProviderSelect.vue';
import AuthProviderOption from '@shell/components/auth/login/AuthProviderOption.vue';
import { RcDropdownGroup, RcDropdownItemCheckbox } from '@components/RcDropdown';
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

const createWrapper = (options: Option[], remember = false) => shallowMount(AuthProviderSelect, {
  props:  { options, remember },
  global: {
    mocks: { t: (key: string) => key },
    stubs: {
      // Stands in for floating-vue, which renders the menu into a popper.
      RcDropdown: { template: '<div><slot /><slot name="dropdownCollection" /></div>' },
      // Rendered for real, so the options nested in its slot are reachable.
      RcDropdownGroup: false,
    },
  },
});

describe('component: AuthProviderSelect', () => {
  it('should group the external providers under a heading', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh'), option('local', true)]);

    const group = wrapper.findComponent(RcDropdownGroup);

    expect(group.exists()).toBe(true);
    expect(group.props('label')).toBe('login.providers.heading');
    expect(group.findAllComponents(AuthProviderOption)).toHaveLength(2);
  });

  // Local renders its own username/password form, so it sits apart from the
  // external providers rather than inside their group.
  it('should present local outside the provider group', () => {
    const wrapper = createWrapper([option('okta-corp'), option('local', true)]);

    const grouped = wrapper.findComponent(RcDropdownGroup).findAllComponents(AuthProviderOption);
    const all = wrapper.findAllComponents(AuthProviderOption);

    expect(all).toHaveLength(2);
    expect(grouped).toHaveLength(1);
    expect(all[1].props('option').isLocal).toBe(true);
  });

  it('should omit local when it is not configured', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh')]);

    expect(wrapper.findAllComponents(AuthProviderOption)).toHaveLength(2);
    expect(wrapper.findAllComponents(AuthProviderOption).every((o) => !o.props('option').isLocal)).toBe(true);
  });

  it('should raise the chosen provider to the page', () => {
    const wrapper = createWrapper([option('okta-corp'), option('gh')]);

    wrapper.findAllComponents(AuthProviderOption)[1].vm.$emit('select', option('gh'));

    expect(wrapper.emitted('select')?.[0][0]).toMatchObject({ id: 'gh' });
  });

  it('should reflect whether the choice is being remembered', () => {
    const wrapper = createWrapper([option('okta-corp')], true);

    expect(wrapper.findComponent(RcDropdownItemCheckbox).props('modelValue')).toBe(true);
  });

  it('should raise the remember toggle to the page', () => {
    const wrapper = createWrapper([option('okta-corp')]);

    wrapper.findComponent(RcDropdownItemCheckbox).vm.$emit('click', true);

    expect(wrapper.emitted('update:remember')?.[0]).toStrictEqual([true]);
  });
});
