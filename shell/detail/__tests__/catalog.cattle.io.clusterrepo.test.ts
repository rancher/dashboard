import { shallowMount } from '@vue/test-utils';
import ClusterRepoDetail, { parseGitWeb } from '@shell/detail/catalog.cattle.io.clusterrepo.vue';
import { REPO } from '@shell/config/query-params';

jest.mock('@shell/utils/require-asset', () => ({ requireAsset: (path: string) => path }));

describe('view: catalog.cattle.io.clusterrepo', () => {
  const UI_PLUGIN_VERSION = { annotations: { 'catalog.cattle.io/ui-component': 'plugins' } };

  const charts = [
    { repoKey: 'cluster/git-repo', versions: [{ annotations: {} }] },
    { repoKey: 'cluster/git-repo', versions: [{ annotations: {} }] },
    // extension (UI plugin) charts are counted and linked separately
    { repoKey: 'cluster/git-repo', versions: [UI_PLUGIN_VERSION] },
    { repoKey: 'cluster/other-repo', versions: [{ annotations: {} }] },
  ];

  const createWrapper = (value: any) => {
    return shallowMount(ClusterRepoDetail as any, {
      props:  { value },
      global: {
        mocks: {
          $store: {
            getters:  { 'catalog/charts': charts },
            dispatch: jest.fn(),
          },
          $fetchState: { pending: false },
          $route:      { params: { cluster: 'c-abc' }, query: {} },
          t:           (key: string, args?: any) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
        },
        stubs: {
          ResourceTabs: true, Tab: true, LiveDate: true, RcIcon: true
        },
      },
    });
  };

  const gitRepo = {
    _key:                'cluster/git-repo',
    type:                'catalog.cattle.io.clusterrepo',
    metadata:            { name: 'git-repo' },
    spec:                { gitRepo: 'https://github.com/rancher/charts.git', gitBranch: 'main' },
    status:              { commit: 'abc123', downloadTime: '2026-08-26T00:00:00Z' },
    isGit:               true,
    isOciType:           false,
    isSuseAppCollection: false,
    urlDisplay:          'https://github.com/rancher/charts.git',
    branchDisplay:       'main',
  };

  it('counts charts belonging to this repo, excluding extensions', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).chartCount).toBe(2);
  });

  it('counts extension charts for this repo separately', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).extensionCount).toBe(1);
  });

  it('builds a charts route filtered to this repo by _key', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).chartsLocation).toStrictEqual({
      name:   'c-cluster-apps-charts',
      params: { cluster: 'c-abc' },
      query:  { [REPO]: 'cluster/git-repo' },
    });
  });

  it('builds a route to the extensions page', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).extensionsLocation).toStrictEqual({
      name:   'c-cluster-uiplugins',
      params: { cluster: 'c-abc' },
      hash:   '#available',
    });
  });

  it('links a git repo url to its browseable provider page', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).urlLink).toBe('https://github.com/rancher/charts');
  });

  it('does not link a git remote hosted on an unrecognized host', () => {
    const wrapper = createWrapper({
      ...gitRepo,
      spec:       { gitRepo: 'https://git.rancher.io/charts' },
      urlDisplay: 'https://git.rancher.io/charts',
    });

    expect((wrapper.vm as any).urlLink).toBeNull();
  });

  it('links helm index urls directly', () => {
    const wrapper = createWrapper({
      ...gitRepo,
      isGit:      false,
      spec:       { url: 'https://charts.rancher.io' },
      urlDisplay: 'https://charts.rancher.io',
    });

    expect((wrapper.vm as any).urlLink).toBe('https://charts.rancher.io');
  });

  it('does not link oci urls', () => {
    const wrapper = createWrapper({
      ...gitRepo,
      isGit:      false,
      isOciType:  true,
      urlDisplay: 'oci://registry.example.com/charts',
    });

    expect((wrapper.vm as any).urlLink).toBeNull();
  });

  it('resolves the git visual with icon and title', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).repoVisual).toStrictEqual({ icon: 'git', titleKey: 'catalog.repo.target.git.title' });
  });

  it('resolves the helm visual with icon and title for http repos', () => {
    const wrapper = createWrapper({
      ...gitRepo, isGit: false, isOciType: false, spec: { url: 'https://charts.rancher.io' }
    });

    expect((wrapper.vm as any).repoVisual).toStrictEqual({ icon: 'helm', titleKey: 'catalog.repo.target.http.title' });
  });

  it('resolves the oci visual with an image asset', () => {
    const wrapper = createWrapper({
      ...gitRepo, isGit: false, isOciType: true
    });
    const visual = (wrapper.vm as any).repoVisual;

    expect(visual.icon).toBeUndefined();
    expect(visual.src).toBeDefined();
    expect(visual.titleKey).toBe('catalog.repo.target.oci.title');
  });

  it('links authentication to the secret detail page when a client secret exists', () => {
    const wrapper = createWrapper({
      ...gitRepo,
      spec: { ...gitRepo.spec, clientSecret: { name: 'my-secret', namespace: 'cattle-system' } },
    });

    expect((wrapper.vm as any).authLocation).toStrictEqual({
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        product:   'explorer',
        cluster:   'c-abc',
        resource:  'secret',
        namespace: 'cattle-system',
        id:        'my-secret',
      },
    });
    expect((wrapper.vm as any).authDisplay).toBe('cattle-system/my-secret');
  });

  it('shows no authentication link when no client secret exists', () => {
    const wrapper = createWrapper(gitRepo);

    expect((wrapper.vm as any).authLocation).toBeNull();
    expect((wrapper.vm as any).authDisplay).toBe('generic.none');
  });

  it('formats the OCI exponential back off values', () => {
    const wrapper = createWrapper({
      ...gitRepo,
      isOciType: true,
      spec:      {
        ...gitRepo.spec,
        exponentialBackOffValues: {
          minWait: 1, maxWait: 5, maxRetries: 3
        }
      },
    });

    expect((wrapper.vm as any).backOffDisplay).toBe('1 / 5 / 3');
  });

  it('falls back to none when no back off values are set', () => {
    const wrapper = createWrapper({ ...gitRepo, isOciType: true });

    expect((wrapper.vm as any).backOffDisplay).toBe('generic.none');
  });

  describe('git provider links', () => {
    it('links commit and branch to github', () => {
      const wrapper = createWrapper(gitRepo);

      expect((wrapper.vm as any).commitLink).toBe('https://github.com/rancher/charts/commit/abc123');
      expect((wrapper.vm as any).branchLink).toBe('https://github.com/rancher/charts/tree/main');
    });

    it('uses the gitlab path format', () => {
      const wrapper = createWrapper({
        ...gitRepo,
        spec: { gitRepo: 'https://gitlab.com/rancher/charts.git', gitBranch: 'main' },
      });

      expect((wrapper.vm as any).commitLink).toBe('https://gitlab.com/rancher/charts/-/commit/abc123');
      expect((wrapper.vm as any).branchLink).toBe('https://gitlab.com/rancher/charts/-/tree/main');
    });

    it('does not link for unrecognized hosts', () => {
      const wrapper = createWrapper({
        ...gitRepo,
        spec: { gitRepo: 'https://git.example.com/rancher/charts.git', gitBranch: 'main' },
      });

      expect((wrapper.vm as any).commitLink).toBeNull();
      expect((wrapper.vm as any).branchLink).toBeNull();
    });

    it('does not link a branch when none is set (default branch)', () => {
      const wrapper = createWrapper({
        ...gitRepo,
        spec: { gitRepo: 'https://github.com/rancher/charts.git' },
      });

      expect((wrapper.vm as any).branchLink).toBeNull();
      expect((wrapper.vm as any).commitLink).toBe('https://github.com/rancher/charts/commit/abc123');
    });

    it('does not link a commit when the repo is not git', () => {
      const wrapper = createWrapper({
        ...gitRepo, isGit: false, isOciType: true
      });

      expect((wrapper.vm as any).commitLink).toBeNull();
    });
  });

  describe('parseGitWeb', () => {
    it.each([
      ['https://github.com/rancher/charts.git', { host: 'github.com', base: 'https://github.com/rancher/charts' }],
      ['git@github.com:rancher/charts.git', { host: 'github.com', base: 'https://github.com/rancher/charts' }],
      ['ssh://git@gitlab.com/rancher/charts.git', { host: 'gitlab.com', base: 'https://gitlab.com/rancher/charts' }],
      ['https://user:pass@github.com/rancher/charts', { host: 'github.com', base: 'https://github.com/rancher/charts' }],
    ])('normalizes %s', (input, expected) => {
      expect(parseGitWeb(input)).toStrictEqual(expected);
    });

    it.each([
      [''],
      [undefined],
      ['not a url'],
    ])('returns null for %s', (input) => {
      expect(parseGitWeb(input as any)).toBeNull();
    });
  });
});
