import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import { AUTH_TYPE } from '@shell/config/types';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret.vue';

const requiredSetup = () => {
  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

  return { global: { plugins: [store], mocks: { $fetchState: {} } } };
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

  describe('credential fields', () => {
    const credentialFields = [
      [AUTH_TYPE._SSH, 'auth-secret-ssh-public-key', 'selectOrCreateAuthSecret.ssh.publicKey'],
      [AUTH_TYPE._SSH, 'auth-secret-ssh-private-key', 'selectOrCreateAuthSecret.ssh.privateKey'],
      [AUTH_TYPE._BASIC, 'auth-secret-basic-username', 'selectOrCreateAuthSecret.basic.username'],
      [AUTH_TYPE._BASIC, 'auth-secret-basic-password', 'selectOrCreateAuthSecret.basic.password'],
    ];

    const findCredentialInput = (selected: string, testId: string) => {
      const wrapper = mount(SelectOrCreateAuthSecret, {
        ...requiredSetup(),
        props: {
          mode:               _EDIT,
          namespace:          'default',
          value:              {},
          registerBeforeHook: () => {},
        },
        data() {
          return { selected } as any;
        }
      });

      return wrapper.findAllComponents({ name: 'LabeledInput' }).find((c) => c.vm.$attrs['data-testid'] === testId)!;
    };

    it.each(credentialFields)('should mark the %p %p field as required', (selected, testId) => {
      expect(findCredentialInput(selected, testId).props('required')).toStrictEqual(true);
    });

    it.each(credentialFields)('should report the %p %p field as required when empty', (selected, testId, labelKey) => {
      const [rule] = findCredentialInput(selected, testId).props('rules');

      expect(rule('')).toStrictEqual(`validation.required-${ JSON.stringify({ key: labelKey }) }`);
    });

    it.each(credentialFields)('should accept a value in the %p %p field', (selected, testId) => {
      const [rule] = findCredentialInput(selected, testId).props('rules');

      expect(rule('value')).toStrictEqual(undefined);
    });

    it.each([
      'auth-secret-ssh-public-key',
      'auth-secret-ssh-private-key',
    ])('should give the %p textarea a one line minimum height', (testId) => {
      const textArea = findCredentialInput(AUTH_TYPE._SSH, testId).findComponent({ name: 'TextAreaAutoGrow' });

      expect(textArea.props('minHeight')).toStrictEqual(19);
    });
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

  describe('namespace select for a new secret', () => {
    const createSecret = jest.fn();

    const namespaceSetup = (props: Record<string, unknown> = {}, selected: string = AUTH_TYPE._SSH) => {
      const $store = {
        getters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': () => [{ id: 'fleet-default' }, { id: 'cattle-system' }, { id: 'apps' }],
        },
        dispatch: (action: string, data: unknown) => action === 'cluster/create' ? createSecret(data) : undefined,
      };

      return mount(SelectOrCreateAuthSecret, {
        global: { ...requiredSetup().global, mocks: { $fetchState: {}, $store } },
        props:  {
          mode:               _EDIT,
          namespace:          'cattle-system',
          value:              null,
          registerBeforeHook: () => {},
          ...props,
        },
        data() {
          return { selected } as any;
        }
      });
    };

    const findNamespaceSelect = (wrapper: ReturnType<typeof namespaceSetup>) => wrapper.find('[data-testid="auth-secret-namespace-select"]');

    beforeEach(() => {
      createSecret.mockReset();
      createSecret.mockImplementation(({ metadata }) => ({
        id:   `${ metadata.namespace }/auth-abc`,
        metadata,
        save: jest.fn(),
      }));
    });

    it('should not show the namespace select when allowNamespaceSelect is not set', () => {
      const wrapper = namespaceSetup();

      expect(findNamespaceSelect(wrapper).exists()).toStrictEqual(false);
    });

    it.each([
      AUTH_TYPE._SSH,
      AUTH_TYPE._BASIC,
      AUTH_TYPE._IMAGE_PULL_SECRET,
    ])('should show the namespace select for %p when allowNamespaceSelect is true', (selected) => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true }, selected);

      expect(findNamespaceSelect(wrapper).exists()).toStrictEqual(true);
    });

    it.each([
      AUTH_TYPE._NONE,
      AUTH_TYPE._S3,
      AUTH_TYPE._RKE,
      AUTH_TYPE._GITHUB_APP,
      'cattle-system/existing-secret',
    ])('should not show the namespace select for %p when allowNamespaceSelect is true', (selected) => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true }, selected);

      expect(findNamespaceSelect(wrapper).exists()).toStrictEqual(false);
    });

    it('should default the selected namespace to the namespace prop', () => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true });

      expect((wrapper.vm as any).createNamespace).toStrictEqual('cattle-system');
    });

    it('should list the namespaces of the store in alphabetical order', () => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true });

      expect((wrapper.vm as any).namespaceOptions).toStrictEqual(['apps', 'cattle-system', 'fleet-default']);
    });

    it('should follow the namespace prop when it changes', async() => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true });

      await wrapper.setProps({ namespace: 'apps' });

      expect((wrapper.vm as any).createNamespace).toStrictEqual('apps');
    });

    it.each([
      [false, 'col span-3', 'col span-3'],
      [true, 'col span-3', 'col span-2'],
    ])('should use four columns when the namespace select is shown (showSshKnownHosts %p)', (showSshKnownHosts, firstCol, moreCols) => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true, showSshKnownHosts });

      expect([(wrapper.vm as any).firstCol, (wrapper.vm as any).moreCols]).toStrictEqual([firstCol, moreCols]);
    });

    it.each([
      [false, 'col span-4', 'col span-4'],
      [true, 'col span-4', 'col span-3'],
    ])('should keep the default columns when the namespace select is not shown (showSshKnownHosts %p)', (showSshKnownHosts, firstCol, moreCols) => {
      const wrapper = namespaceSetup({ showSshKnownHosts });

      expect([(wrapper.vm as any).firstCol, (wrapper.vm as any).moreCols]).toStrictEqual([firstCol, moreCols]);
    });

    it('should create the secret in the selected namespace', async() => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true });

      await wrapper.setData({ createNamespace: 'apps' });
      await (wrapper.vm as any).doCreate();

      expect(createSecret).toHaveBeenCalledWith({ type: 'secret', metadata: { namespace: 'apps', generateName: 'auth-' } });
    });

    it('should create the secret in the namespace prop when allowNamespaceSelect is not set', async() => {
      const wrapper = namespaceSetup();

      await wrapper.setData({ createNamespace: 'apps' });
      await (wrapper.vm as any).doCreate();

      expect(createSecret).toHaveBeenCalledWith({ type: 'secret', metadata: { namespace: 'cattle-system', generateName: 'auth-' } });
    });

    it('should emit the namespace and name of the new secret when limitToNamespace is false', async() => {
      const wrapper = namespaceSetup({ allowNamespaceSelect: true, limitToNamespace: false });

      await wrapper.setData({ createNamespace: 'apps' });
      await (wrapper.vm as any).doCreate();

      const emitted = wrapper.emitted('update:value') as any[];

      expect(emitted[emitted.length - 1][0]).toStrictEqual({ namespace: 'apps', name: 'auth-abc' });
    });
  });
});
