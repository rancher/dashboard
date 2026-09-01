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

  describe('GitHub App auth', () => {
    const githubAppSetup = () => mount(SelectOrCreateAuthSecret, {
      ...requiredSetup(),
      props: {
        mode:               _EDIT,
        namespace:          'default',
        value:              {},
        allowGithubApp:     true,
        registerBeforeHook: () => {},
      },
      data() {
        return { selected: AUTH_TYPE._GITHUB_APP } as any;
      }
    });

    it('should render the three GitHub App fields when selected', () => {
      const wrapper = githubAppSetup();

      expect(wrapper.find('[data-testid="auth-secret-github-app-id"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="auth-secret-github-app-installation-id"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="auth-secret-github-app-private-key"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="auth-secret-github-app-private-key-file"]').exists()).toBe(true);
    });

    it('should not narrow the select column for GitHub App (keeps span-6)', () => {
      const wrapper = githubAppSetup();

      expect((wrapper.vm as any).firstCol).toBe('col span-6');
    });

    it('should emit inputauthval with the GitHub App field values', async() => {
      const wrapper = githubAppSetup();

      await wrapper.setData({
        githubAppId:             'app-id',
        githubAppInstallationId: 'installation-id',
        githubAppPrivateKey:     'private-key',
      });

      const emitted = wrapper.emitted('inputauthval') as any[];
      const last = emitted[emitted.length - 1][0];

      expect(last).toStrictEqual({
        selected:                AUTH_TYPE._GITHUB_APP,
        publicKey:               '',
        privateKey:              '',
        githubAppId:             'app-id',
        githubAppInstallationId: 'installation-id',
        githubAppPrivateKey:     'private-key',
      });
    });

    it('should populate the private key when a file is read', async() => {
      const wrapper = githubAppSetup();

      const fileSelector = wrapper.findComponent({ name: 'FileSelector' });

      await fileSelector.vm.$emit('selected', 'key-from-file');

      expect((wrapper.vm as any).githubAppPrivateKey).toBe('key-from-file');
    });

    it.each([
      ['offer', true],
      ['not offer', false],
    ])('should %s the GitHub App create option when allowGithubApp is %p', (_, allowGithubApp) => {
      const wrapper = mount(SelectOrCreateAuthSecret, {
        ...requiredSetup(),
        props: {
          mode:               _EDIT,
          namespace:          'default',
          value:              {},
          allowGithubApp,
          registerBeforeHook: () => {},
        },
      });

      const hasGithubAppOption = (wrapper.vm as any).options
        .some((o: any) => o.value === AUTH_TYPE._GITHUB_APP);

      expect(hasGithubAppOption).toBe(allowGithubApp);
    });

    it('should list existing GitHub App secrets but exclude plain Opaque secrets', () => {
      const githubAppSecret = {
        _type:          'Opaque',
        isGithubApp:    true,
        id:             'default/gh-app',
        dataPreview:    '3 keys',
        subTypeDisplay: 'Opaque',
        metadata:       { name: 'gh-app', namespace: 'default' },
      };
      const plainOpaqueSecret = {
        _type:          'Opaque',
        isGithubApp:    false,
        id:             'default/plain',
        dataPreview:    '1 key',
        subTypeDisplay: 'Opaque',
        metadata:       { name: 'plain', namespace: 'default' },
      };

      const wrapper = mount(SelectOrCreateAuthSecret, {
        ...requiredSetup(),
        props: {
          mode:               _EDIT,
          namespace:          'default',
          value:              {},
          allowGithubApp:     true,
          registerBeforeHook: () => {},
        },
        data() {
          return { allSecrets: [githubAppSecret, plainOpaqueSecret] } as any;
        }
      });

      const optionValues = (wrapper.vm as any).options.map((o: any) => o.value);

      expect(optionValues).toContain('default/gh-app');
      expect(optionValues).not.toContain('default/plain');
    });
  });
});
