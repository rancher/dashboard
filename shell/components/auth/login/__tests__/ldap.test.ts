import { shallowMount } from '@vue/test-utils';
import Ldap from '@shell/components/auth/login/ldap.vue';
import Password from '@shell/components/form/Password.vue';

const usernameFocus = jest.fn();
const buttonFocus = jest.fn();

const createWrapper = (props: { open: boolean, focusOnMount?: boolean }) => shallowMount(Ldap, {
  props: {
    name: 'openldap-2', type: 'openLdapProvider', focusOnMount: true, ...props
  },
  global: {
    mocks: {
      t:      (key: string) => key,
      $store: { dispatch: jest.fn() },
    },
    stubs: {
      LabeledInput: { template: '<input />', methods: { focus: usernameFocus } },
      RcButton:     { template: '<button />', methods: { focus: buttonFocus } },
    },
  },
});

describe('component: ldap login', () => {
  beforeEach(() => {
    usernameFocus.mockClear();
    buttonFocus.mockClear();
  });

  // The local form starts at its first field, so the directory form does too.
  it('should focus the username when it opens with the form showing', () => {
    createWrapper({ open: true });

    expect(usernameFocus).toHaveBeenCalledWith();
    expect(buttonFocus).not.toHaveBeenCalled();
  });

  it('should focus the button when the form is not showing', () => {
    createWrapper({ open: false });

    expect(buttonFocus).toHaveBeenCalledWith();
    expect(usernameFocus).not.toHaveBeenCalled();
  });

  it('should not take focus when it is not asked to', () => {
    createWrapper({ open: true, focusOnMount: false });

    expect(usernameFocus).not.toHaveBeenCalled();
    expect(buttonFocus).not.toHaveBeenCalled();
  });

  // Same field as the local form, so the password can be revealed here too.
  it('should take the password in the password field the local form uses', () => {
    const wrapper = createWrapper({ open: true });
    const password = wrapper.findComponent(Password);

    expect(password.exists()).toBe(true);
    expect(password.props('label')).toBe('login.password');
    expect(password.props('autocomplete')).toBe('current-password');
  });
});
