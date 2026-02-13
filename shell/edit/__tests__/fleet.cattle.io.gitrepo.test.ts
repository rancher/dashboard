import { mount } from '@vue/test-utils';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { AUTH_TYPE } from '@shell/config/types';
import GitRepo from '@shell/models/fleet.cattle.io.gitrepo';
import GitRepoComponent from '@shell/edit/fleet.cattle.io.gitrepo.vue';

const mockStore = {
  dispatch: jest.fn(),
  commit:   jest.fn(),
  getters:  {
    'i18n/t':                  (text: string) => text,
    'i18n/exists':             jest.fn(),
    t:                         (text: string) => text,
    currentStore:              () => 'current_store',
    'current_store/schemaFor': jest.fn(),
    'current_store/all':       jest.fn(),
    workspace:                 '',
  },
  rootGetters: { 'i18n/t': jest.fn() },
};

const mocks = {
  $store:      mockStore,
  $fetchState: { pending: false },
  $route:      {
    query: { AS: '' },
    name:  {
      endsWith: () => {
        return false;
      }
    }
  },
};

const mockComputed = {
  ...GitRepoComponent.computed,
  steps: () => [{
    name:           'stepAdvanced',
    title:          'title',
    label:          'label',
    subtext:        'subtext',
    descriptionKey: 'description',
    ready:          true,
    weight:         1,
  }],
};

const mockRepo = {
  type:       'fleet.cattle.io.gitrepo',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'GitRepo',
  metadata:   {
    name:      `test`,
    namespace: 'test',
  },
  spec: {
    targetNamespace: 'custom-namespace-name',
    targets:         [
      { clusterName: `fleet-local` }
    ],
  },
  status:       {},
  currentRoute: () => {},
};

const initGitRepo = (props: any, value?: any) => {
  const initValue = new GitRepo({
    ...mockRepo,
    ...(value || {})
  }, {
    getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
    dispatch:    jest.fn(),
    rootGetters: { 'i18n/t': jest.fn() },
  });

  return {
    props: {
      value:     initValue,
      liveValue: initValue,
      ...props
    },
    computed: mockComputed,
    global:   { mocks },
  };
};

describe('view: fleet.cattle.io.gitrepo, mode: view - should', () => {
  it('hide advanced options banner', () => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _VIEW }));

    const advancedInfoBanner = wrapper.find('[data-testid="gitrepo-advanced-info"]');

    expect(advancedInfoBanner.exists()).toBeFalsy();
  });
});

describe.each([
  _CREATE,
  _EDIT,
])('view: fleet.cattle.io.gitrepo, mode: %p - should', (mode) => {
  const wrapper = mount(GitRepoComponent, initGitRepo({ mode }));

  it('show advanced options banner', () => {
    const advancedInfoBanner = wrapper.find('[data-testid="gitrepo-advanced-info"]');

    expect(advancedInfoBanner.exists()).toBeTruthy();
  });

  it('have self-healing checkbox and tooltip', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="gitRepo-correctDrift-checkbox"]');
    const tooltip = wrapper.find('[data-testid="gitRepo-correctDrift-checkbox"]');

    expect(tooltip.element.classList).toContain('has-clean-tooltip');
    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftCheckbox.attributes().value).toBeFalsy();
  });

  it('have keep-resources checkbox and tooltip', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="gitRepo-keepResources-checkbox"]');
    const tooltip = wrapper.find('[data-testid="gitRepo-keepResources-checkbox"]');

    expect(tooltip.element.classList).toContain('has-clean-tooltip');
    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftCheckbox.attributes().value).toBeFalsy();
  });

  it('enable drift if self-healing is checked', async() => {
    const correctDriftCheckbox = wrapper.findComponent('[data-testid="gitRepo-correctDrift-checkbox"]') as any;
    const correctDriftContainer = wrapper.find('[data-testid="gitRepo-correctDrift-checkbox"] .checkbox-container');

    expect(correctDriftContainer.exists()).toBeTruthy();

    await correctDriftContainer.trigger('click');

    expect(correctDriftCheckbox.emitted('update:value')).toHaveLength(1);
    expect(correctDriftCheckbox.emitted('update:value')![0][0]).toBe(true);
    expect(correctDriftCheckbox.props().value).toBeTruthy();
  });

  it.each([
    ['show Polling Interval and warnings', 'enabled', undefined, true],
    ['show Polling Interval and warnings', 'enabled', false, true],
    ['hide Polling Interval and warnings', 'disabled', true, false],
  ])('show Enable Polling checkbox and %p if %p, with spec.disablePolling: %p', (
    descr1,
    descr2,
    disablePolling,
    enabled
  ) => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ realMode: mode }, {
      spec: {
        disablePolling,
        pollingInterval: 10
      },
      status: { webhookCommit: 'sha' },
    }));

    const pollingCheckbox = wrapper.findComponent('[data-testid="gitRepo-enablePolling-checkbox"]') as any;
    const pollingIntervalInput = wrapper.find('[data-testid="gitRepo-pollingInterval-input"]');
    const pollingIntervalMinimumValueWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-minimumValueWarning"]');
    const pollingIntervalWebhookWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-webhookWarning"]');

    expect(pollingIntervalMinimumValueWarning.exists()).toBe(enabled);
    expect(pollingIntervalWebhookWarning.exists()).toBe(enabled);
    expect(pollingCheckbox.exists()).toBeTruthy();
    expect(pollingCheckbox.vm.value).toBe(enabled);
    expect(pollingIntervalInput.exists()).toBe(enabled);
  });

  const defaultPollingInterval = mode === _CREATE ? '60' : '15';

  it.each([
    ['null', `default ${ defaultPollingInterval } seconds`, null, defaultPollingInterval],
    ['0', `default ${ defaultPollingInterval } seconds`, 0, defaultPollingInterval],
    ['1', 'custom 1 second', 1, '1'],
    ['60', 'custom 60 seconds', 60, '60'],
    ['15', 'custom 15 seconds', 15, '15'],
    ['0s', `default ${ defaultPollingInterval } seconds`, 0, defaultPollingInterval],
    ['1s', 'custom 1 second', '1s', '1'],
    ['60s', 'custom 60 seconds', '1m', '60'],
    ['1m3s', 'custom 63 seconds', '1m3s', '63'],
    ['1h2m3s', 'custom 3723 seconds', '1h2m3s', '3723'],
    ['15', 'custom 15 seconds', '15s', '15'],
  ])('show Polling Interval input with source: %p, value: %p', async(
    descr1,
    descr2,
    pollingInterval,
    unitValue,
  ) => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ realMode: mode }, { spec: { pollingInterval } }));

    const pollingIntervalInput = wrapper.find('[data-testid="gitRepo-pollingInterval-input"]').element as any;

    expect(pollingIntervalInput).toBeDefined();
    expect(pollingIntervalInput.value).toBe(unitValue);
  });

  it.each([
    ['hide', 'source: null, value: equal to 60', null, false],
    ['hide', 'source: 0, value: equal to 60', 0, false],
    ['hide', 'source: 15, value: equal to 15', 15, false],
    ['hide', 'source: 60, value: equal to 60', 60, false],
    ['hide', 'source: 16, value: higher than 15', 16, false],
    ['show', 'source: 1, value: lower than 15', 1, true],
  ])('%p Polling Interval warning if %p', async(
    descr1,
    descr2,
    pollingInterval,
    visible,
  ) => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ realMode: mode }, { spec: { pollingInterval } }));

    const pollingIntervalMinimumValueWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-minimumValueWarning"]');

    expect(pollingIntervalMinimumValueWarning.exists()).toBe(visible);
  });

  it.each([
    ['hide', 'disabled', null, false],
    ['hide', 'disabled', false, false],
    ['hide', 'disabled', '', false],
    ['show', 'enabled', 'sha', true],
  ])('%p Webhook configured warning if webhook is %p', (
    descr1,
    descr2,
    webhookCommit,
    visible
  ) => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ realMode: mode }, {
      spec:   { pollingInterval: 60 },
      status: { webhookCommit },
    }));

    const pollingIntervalWebhookWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-webhookWarning"]');

    expect(pollingIntervalWebhookWarning.exists()).toBe(visible);
  });

  it.todo('test paths and subpaths');
});

describe('view: fleet.cattle.io.gitrepo, GitHub password banner - should', () => {
  it('show GitHub password banner when GitHub.com repository and basic auth is selected', async() => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _CREATE }, { spec: { repo: 'https://github.com/rancher/fleet-examples' } }));

    // Check computed properties
    expect(wrapper.vm.isGitHubDotComRepository).toBeTruthy();

    // Set basic auth selection in tempCachedValues
    await wrapper.setData({ tempCachedValues: { clientSecretName: { selected: AUTH_TYPE._BASIC } } });

    // Check computed property after setting data
    expect(wrapper.vm.isBasicAuthSelected).toBeTruthy();

    await wrapper.vm.$nextTick();

    const githubBanner = wrapper.find('[data-testid="gitrepo-githubdotcom-password-warning"]');

    expect(githubBanner.exists()).toBeTruthy();

    // Check the banner element
    const bannerElement = wrapper.find('.banner.warning');

    expect(bannerElement.exists()).toBeTruthy();
  });

  it('show GitHub password banner in edit mode when conditions are met', async() => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _EDIT }, { spec: { repo: 'https://github.com/rancher/fleet-examples' } }));

    await wrapper.setData({ tempCachedValues: { clientSecretName: { selected: AUTH_TYPE._BASIC } } });

    const githubBanner = wrapper.find('[data-testid="gitrepo-githubdotcom-password-warning"]');

    expect(githubBanner.exists()).toBeTruthy();
  });

  it('hide GitHub password banner when not using GitHub.com repository', async() => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _CREATE }, { spec: { repo: 'https://gitlab.com/user/repo' } }));

    await wrapper.setData({ tempCachedValues: { clientSecretName: { selected: AUTH_TYPE._SSH } } });

    const githubBanner = wrapper.find('[data-testid="gitrepo-githubdotcom-password-warning"]');

    expect(githubBanner.exists()).toBeFalsy();
  });

  it('hide GitHub password banner when not using basic auth', async() => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _CREATE }, { spec: { repo: 'https://github.com/rancher/fleet-examples' } }));

    await wrapper.setData({ tempCachedValues: { clientSecretName: { selected: AUTH_TYPE._SSH } } });

    const githubBanner = wrapper.find('[data-testid="gitrepo-githubdotcom-password-warning"]');

    expect(githubBanner.exists()).toBeFalsy();
  });

  it('hide GitHub password banner when no auth is selected', async() => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _CREATE }, { spec: { repo: 'https://github.com/rancher/fleet-examples' } }));

    await wrapper.setData({ tempCachedValues: { clientSecretName: { selected: AUTH_TYPE._NONE } } });

    const githubBanner = wrapper.find('[data-testid="gitrepo-githubdotcom-password-warning"]');

    expect(githubBanner.exists()).toBeFalsy();
  });

  it.each([
    ['https://github.com/user/repo', true],
    ['https://GitHub.com/user/repo', true],
    ['HTTPS://GITHUB.COM/user/repo', true],
    ['https://api.github.com/user/repo', false], // subdomain doesn't match
    ['https://raw.github.com/user/repo', false], // subdomain doesn't match
    ['https://company-github.com/user/repo', false], // doesn't contain exact 'https://github.com'
    ['https://github.company.com/user/repo', true], // contains exact 'https://github.com' at start
    ['https://gitlab.com/user/repo', false],
    ['https://bitbucket.org/user/repo', false],
    ['http://github.com/user/repo', false], // not https
    ['git@github.com:user/repo.git', false], // not https
  ])('correctly detect GitHub.com repository for URL: %s (expected: %s)', async(repoUrl, shouldShowBanner) => {
    const wrapper = mount(GitRepoComponent, initGitRepo({ mode: _CREATE }, { spec: { repo: repoUrl } }));

    await wrapper.setData({ tempCachedValues: { clientSecretName: { selected: AUTH_TYPE._BASIC } } });

    const githubBanner = wrapper.find('[data-testid="gitrepo-githubdotcom-password-warning"]');

    expect(githubBanner.exists()).toBe(shouldShowBanner);
  });
});
