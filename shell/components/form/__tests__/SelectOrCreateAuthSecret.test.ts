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
});
