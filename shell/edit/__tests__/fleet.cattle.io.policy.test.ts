import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import FleetPolicyComponent from '@shell/edit/fleet.cattle.io.policy.vue';
import FleetPolicySourceSection from '@shell/components/fleet/FleetPolicySourceSection.vue';
import { _CREATE } from '@shell/config/query-params';
import { SECRET } from '@shell/config/types';

const mockStore = {
  dispatch: jest.fn(),
  commit:   jest.fn(),
  getters:  {
    'i18n/t':      (text: string) => text,
    'i18n/exists': jest.fn(),
    t:             (text: string) => text,
    workspace:     'fleet-default',
  },
  rootGetters: { 'i18n/t': jest.fn() },
};

const mocks = {
  $store:      mockStore,
  $fetchState: { pending: false },
  $route:      { query: { AS: '' }, name: 'c-cluster-product-resource-create' },
  $router:     { replace: jest.fn() },
};

const policy = (data: Record<string, any> = {}) => ({
  type:          'fleet.cattle.io.policy',
  metadata:      { namespace: 'fleet-default' },
  ...data,
  applyDefaults: jest.fn(),
});

const mountPolicy = (value = policy(), data = {}, $store = mockStore) => shallowMount(FleetPolicyComponent, {
  props:  { value, mode: _CREATE },
  data:   () => data,
  global: {
    mocks: { ...mocks, $store },
    stubs: { CruResource: { template: '<div><slot /></div>' } }
  },
});

describe('edit: fleet.cattle.io.policy', () => {
  it('should give the form both sub-objects to bind to', () => {
    const value = policy();

    mountPolicy(value);

    expect(value).toStrictEqual(expect.objectContaining({ gitRepo: {}, helmOp: {} }));
  });

  it('should leave the defaults to the model, which only get applied when creating', () => {
    const value = policy();

    mountPolicy(value);

    expect(value.applyDefaults).not.toHaveBeenCalled();
  });

  it('should render a section for GitRepo and one for HelmOps', () => {
    const wrapper = mountPolicy();

    expect(wrapper.findAllComponents(FleetPolicySourceSection).map((s) => s.props('variant')))
      .toStrictEqual(['gitRepo', 'helmOp']);
  });

  it('should start restricted where the policy already lists allowed names', () => {
    const wrapper = mountPolicy(policy({
      allowedServiceAccounts: ['tenant-1-deployer'],
      helmOp:                 { allowedHelmSecretNames: ['tenant-1-helm-credentials'] },
    }));

    expect(wrapper.vm.restrictServiceAccounts).toBe(true);
    expect(wrapper.vm.restrictGitRepoSecrets).toBe(false);
    expect(wrapper.vm.restrictHelmOpSecrets).toBe(true);
  });

  it('should only offer service accounts and secrets from the policy namespace', async() => {
    const wrapper = mountPolicy(policy(), {
      serviceAccounts: [
        { metadata: { name: 'tenant-1-deployer', namespace: 'fleet-default' } },
        { metadata: { name: 'elsewhere', namespace: 'fleet-local' } },
      ],
      secrets: [
        { _type: 'kubernetes.io/basic-auth', metadata: { name: 'tenant-1-git-credentials', namespace: 'fleet-default' } },
        { _type: 'kubernetes.io/basic-auth', metadata: { name: 'elsewhere', namespace: 'fleet-local' } },
      ],
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.serviceAccountOptions).toStrictEqual(['tenant-1-deployer']);
    expect(wrapper.vm.gitRepoSecretOptions).toStrictEqual([{ label: 'tenant-1-git-credentials', value: 'tenant-1-git-credentials' }]);
  });

  it('should label a secret the way the GitRepo and HelmOp forms label it', async() => {
    const wrapper = mountPolicy(policy(), {
      secrets: [
        {
          _type:          'kubernetes.io/basic-auth',
          metadata:       { name: 'tenant-1-git-credentials', namespace: 'fleet-default' },
          data:           { username: 'dGVuYW50LTE=' },
          subTypeDisplay: 'HTTP Basic Auth',
          dataPreview:    'tenant-1',
        },
        {
          _type:          'kubernetes.io/ssh-auth',
          metadata:       { name: 'tenant-1-ssh', namespace: 'fleet-default' },
          subTypeDisplay: 'SSH',
        },
      ],
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.gitRepoSecretOptions).toStrictEqual([
      { label: 'tenant-1-git-credentials (HTTP Basic Auth: tenant-1)', value: 'tenant-1-git-credentials' },
      { label: 'tenant-1-ssh (SSH)', value: 'tenant-1-ssh' },
    ]);
  });

  it('should surface an error when the name lists cannot be fetched', async() => {
    const failure = new Error('secrets is forbidden');
    const store = {
      ...mockStore,
      dispatch: jest.fn((_action, { type }) => (type === SECRET ? Promise.reject(failure) : Promise.resolve([]))),
      getters:  { ...mockStore.getters, 'management/schemaFor': () => ({ id: 'schema' }) },
    };
    const wrapper = mountPolicy(policy(), {}, store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(wrapper.vm.errors).toStrictEqual([failure]);
  });

  it('should only offer secrets a policy can actually reference', async() => {
    const wrapper = mountPolicy(policy(), {
      secrets: [
        { _type: 'kubernetes.io/basic-auth', metadata: { name: 'tenant-1-git-credentials', namespace: 'fleet-default' } },
        { _type: 'kubernetes.io/ssh-auth', metadata: { name: 'tenant-1-ssh', namespace: 'fleet-default' } },
        { _type: 'helm.sh/release.v1', metadata: { name: 'sh.helm.release.v1.some-chart.v1', namespace: 'fleet-default' } },
        { _type: 'kubernetes.io/service-account-token', metadata: { name: 'tenant-1-deployer-token', namespace: 'fleet-default' } },
      ],
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.gitRepoSecretOptions.map((option: any) => option.value)).toStrictEqual(['tenant-1-git-credentials', 'tenant-1-ssh']);
  });

  it('should offer a GitHub App secret to GitRepo, which can use it, and not to HelmOps, which cannot', async() => {
    const wrapper = mountPolicy(policy(), {
      secrets: [
        { _type: 'kubernetes.io/basic-auth', metadata: { name: 'tenant-1-git-credentials', namespace: 'fleet-default' } },
        {
          _type:       'Opaque',
          metadata:    { name: 'tenant-1-github-app', namespace: 'fleet-default' },
          isGithubApp: true,
        },
        // An Opaque secret holding something else is not a credential either form can pick
        {
          _type: 'Opaque', metadata: { name: 'tenant-1-notes', namespace: 'fleet-default' }, isGithubApp: false
        },
      ],
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.gitRepoSecretOptions.map((option: any) => option.value))
      .toStrictEqual(['tenant-1-git-credentials', 'tenant-1-github-app']);
    expect(wrapper.vm.helmOpSecretOptions.map((option: any) => option.value))
      .toStrictEqual(['tenant-1-git-credentials']);
  });

  describe('validation', () => {
    it('should fail while a default secret is not one of the allowed secrets', async() => {
      const value = policy({
        name:    'tenant-1-policy',
        gitRepo: { defaultClientSecretName: 'build-bot-credentials', allowedClientSecretNames: ['tenant-1-git-credentials'] },
      });
      const wrapper = mountPolicy(value);

      await wrapper.setData({ restrictGitRepoSecrets: true });

      expect(wrapper.vm.gitRepoDefaultSecretAllowed).toBe(false);
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should pass once the default secret is one of the allowed secrets', async() => {
      const value = policy({
        name:    'tenant-1-policy',
        gitRepo: { defaultClientSecretName: 'tenant-1-git-credentials', allowedClientSecretNames: ['tenant-1-git-credentials'] },
      });
      const wrapper = mountPolicy(value);

      await wrapper.setData({ restrictGitRepoSecrets: true });

      expect(wrapper.vm.gitRepoDefaultSecretAllowed).toBe(true);
      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('should ignore a default secret while the secrets are not restricted', () => {
      const value = policy({
        name:    'tenant-1-policy',
        gitRepo: { defaultClientSecretName: 'build-bot-credentials' },
      });
      const wrapper = mountPolicy(value);

      expect(wrapper.vm.gitRepoDefaultSecretAllowed).toBe(true);
    });

    it('should fail while the policy has no name', () => {
      const wrapper = mountPolicy();

      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should pass when nothing is restricted', () => {
      const wrapper = mountPolicy(policy({ name: 'tenant-1-policy' }));

      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('should fail while a restriction has no name selected yet', async() => {
      const wrapper = mountPolicy(policy({ name: 'tenant-1-policy' }));

      await wrapper.setData({ restrictServiceAccounts: true });

      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should pass once the restriction lists a name', async() => {
      const value = policy({ name: 'tenant-1-policy', allowedServiceAccounts: ['tenant-1-deployer'] });
      const wrapper = mountPolicy(value);

      await wrapper.setData({ restrictServiceAccounts: true });

      expect(wrapper.vm.validationPassed).toBe(true);
    });
  });
});
