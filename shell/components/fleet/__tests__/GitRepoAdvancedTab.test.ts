import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import GitRepoAdvancedTab from '@shell/components/fleet/GitRepoAdvancedTab.vue';
import { _CREATE } from '@shell/config/query-params';

describe('component: GitRepoAdvancedTab', () => {
  const props = {
    value: {
      metadata: { namespace: 'fleet-default' },
      spec:     {},
    },
    mode:                       _CREATE,
    workspace:                  'fleet-default',
    tlsMode:                    'none',
    tlsOptions:                 [],
    isTls:                      false,
    displayHelmRepoUrlRegex:    false,
    tempCachedValues:           {},
    correctDriftEnabled:        false,
    showPollingIntervalWarning: false,
    specifyOption:              'specify',
    registerBeforeHook:         jest.fn(),
    isGithubDotComRepository:   false,
    isBasicAuthSelected:        false,
  };

  it.each([
    ['git', 'gitrepo-git-auth'],
    ['helm', 'gitrepo-helm-auth'],
  ])('should not cache the %s secrets, as the selects on this tab would replace each other\'s list', (_, testId) => {
    const wrapper = shallowMount(GitRepoAdvancedTab, { props, global: { plugins: [createStore({})] } });

    const select = wrapper.findAllComponents({ name: 'SelectOrCreateAuthSecret' }).find((c) => c.attributes('data-testid') === testId);

    expect(select?.props('cacheSecrets')).toBe(false);
  });
});
