import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import { AUTH_TYPE } from '@shell/config/types';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret.vue';

const requiredSetup = () => {
  return { global: { mocks: { $fetchState: {} } } };
};

describe('component: SelectOrCreateAuthSecret', () => {
  it.each([
    ['display', true],
    ['not display', false],
    ['not display', undefined], // prop's default value is used
  ])('mode edit: should %p sshKnownHosts field if enabled and auth type is SSH', (_, showSshKnownHosts) => {
    const wrapper = mount(SelectOrCreateAuthSecret, {
      ...requiredSetup(),
      props: {
        mode:               _EDIT,
        namespace:          'default',
        value:              {},
        showSshKnownHosts,
        registerBeforeHook: () => {},
      },
      data() {
        return { selected: AUTH_TYPE._SSH } as any;
      }
    });

    const knownSshHosts = wrapper.find('[data-testid="auth-secret-known-ssh-hosts"]');

    expect(knownSshHosts.exists()).toBe(showSshKnownHosts || false);
  });

  it.each([
    ['selectOrCreateAuthSecret.basic.passwordPersonalAccessToken', true],
    ['selectOrCreateAuthSecret.basic.password', false],
    ['selectOrCreateAuthSecret.basic.password', undefined],
  ])('should render "%s" label when isGithubDotComRepository is %p', async(expectedLabel, isGithubDotComRepository) => {
    const wrapper = mount(SelectOrCreateAuthSecret, {
      ...requiredSetup(),
      props: {
        mode:               _EDIT,
        namespace:          'default',
        value:              {},
        isGithubDotComRepository,
        registerBeforeHook: () => {},
      },
      data() {
        return { selected: AUTH_TYPE._BASIC } as any;
      }
    });

    await wrapper.vm.$nextTick();

    // Find the LabeledInput component with the password data-testid
    const labeledInputComponents = wrapper.findAllComponents({ name: 'LabeledInput' });

    // The second LabeledInput component should be the password field
    const passwordLabeledInput = labeledInputComponents.length > 1 ? labeledInputComponents[1] : null;

    expect(passwordLabeledInput).not.toBeNull();

    // Check the label-key prop to verify correct i18n key is used
    const expectedLabelKey = isGithubDotComRepository ? 'selectOrCreateAuthSecret.basic.passwordPersonalAccessToken' : 'selectOrCreateAuthSecret.basic.password';

    expect(passwordLabeledInput!.props('labelKey')).toBe(expectedLabelKey);
  });
});
