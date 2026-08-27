import { useKubernetesVersions, getDefaultVersion } from '@shell/composables/useKubernetesVersions';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      }
    }),
    dispatch: mockDispatch,
  }),
}));

const version = (id: string, overrides: Record<string, any> = {}) => ({
  id, serverArgs: {}, agentArgs: {}, charts: {}, ...overrides
});

describe('composable: useKubernetesVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
    mockGetters['i18n/t'] = (key: string) => key;
  });

  const baseProps = () => ({
    mode: _CREATE, liveValue: { spec: {} }, value: { spec: {} }
  });

  describe('versionOptions', () => {
    it('groups rke2 and k3s versions with a header when both are present', () => {
      const { versionOptions, rke2Versions, k3sVersions } = useKubernetesVersions(baseProps());

      rke2Versions.value = [version('v1.28.0+rke2r1')];
      k3sVersions.value = [version('v1.28.0+k3s1')];

      const options = versionOptions.value;

      expect(options[0]).toStrictEqual({ kind: 'group', label: 'cluster.provider.rke2' });
      expect(options.some((o: any) => o.value === 'v1.28.0+rke2r1')).toBe(true);
      expect(options.some((o: any) => o.kind === 'group' && o.label === 'cluster.provider.k3s')).toBe(true);
      expect(options.some((o: any) => o.value === 'v1.28.0+k3s1')).toBe(true);
    });

    it('omits the k3s group when only rke2 versions are present', () => {
      const { versionOptions, rke2Versions } = useKubernetesVersions(baseProps());

      rke2Versions.value = [version('v1.28.0+rke2r1')];

      const options = versionOptions.value;

      expect(options.some((o: any) => o.kind === 'group')).toBe(false);
      expect(options).toHaveLength(1);
      expect(options[0].value).toBe('v1.28.0+rke2r1');
    });

    it('excludes k3s versions in edit mode when the live version is rke2', () => {
      const props = {
        mode: _EDIT, liveValue: { spec: { kubernetesVersion: 'v1.28.0+rke2r1' } }, value: { spec: {} }
      };
      const { versionOptions, rke2Versions, k3sVersions } = useKubernetesVersions(props);

      rke2Versions.value = [version('v1.28.0+rke2r1'), version('v1.29.0+rke2r1')];
      k3sVersions.value = [version('v1.28.0+k3s1')];

      const options = versionOptions.value;

      expect(options.some((o: any) => o.value?.includes('k3s'))).toBe(false);
    });

    it('filters out deprecated patch versions by default', () => {
      const { versionOptions, rke2Versions, showDeprecatedPatchVersions } = useKubernetesVersions(baseProps());

      showDeprecatedPatchVersions.value = false;
      rke2Versions.value = [version('v1.28.0+rke2r1'), version('v1.28.1+rke2r1')];

      const options = versionOptions.value;

      expect(options.map((o: any) => o.value)).toStrictEqual(['v1.28.1+rke2r1']);
    });

    it('shows deprecated patch versions when opted in', () => {
      const { versionOptions, rke2Versions, showDeprecatedPatchVersions } = useKubernetesVersions(baseProps());

      showDeprecatedPatchVersions.value = true;
      rke2Versions.value = [version('v1.28.0+rke2r1'), version('v1.28.1+rke2r1')];

      const options = versionOptions.value;

      expect(options.map((o: any) => o.value).sort()).toStrictEqual(['v1.28.0+rke2r1', 'v1.28.1+rke2r1']);
    });
  });

  describe('selectedVersion', () => {
    it('returns undefined when no kubernetesVersion is set', () => {
      const { selectedVersion } = useKubernetesVersions(baseProps());

      expect(selectedVersion.value).toBeUndefined();
    });

    it('finds the matching version option by kubernetesVersion', () => {
      const props = {
        mode: _CREATE, liveValue: { spec: {} }, value: { spec: { kubernetesVersion: 'v1.28.0+rke2r1' } }
      };
      const { selectedVersion, rke2Versions } = useKubernetesVersions(props);

      rke2Versions.value = [version('v1.28.0+rke2r1'), version('v1.29.0+rke2r1')];

      expect(selectedVersion.value?.value).toBe('v1.28.0+rke2r1');
    });

    it('adds a "none" cni option once, without duplicating it on repeated access', () => {
      const props = {
        mode: _CREATE, liveValue: { spec: {} }, value: { spec: { kubernetesVersion: 'v1.28.0+rke2r1' } }
      };
      const { selectedVersion, rke2Versions } = useKubernetesVersions(props);

      rke2Versions.value = [version('v1.28.0+rke2r1', { serverArgs: { cni: { options: ['calico'] } } })];

      // access twice
      const first = selectedVersion.value;
      const second = selectedVersion.value;

      expect(first?.serverArgs.cni.options).toStrictEqual(['calico', 'none']);
      expect(second?.serverArgs.cni.options).toStrictEqual(['calico', 'none']);
    });
  });

  describe('chartVersions / serverArgs / agentArgs / haveArgInfo', () => {
    it('returns the charts, server args and agent args of the selected version', () => {
      const props = {
        mode: _CREATE, liveValue: { spec: {} }, value: { spec: { kubernetesVersion: 'v1.28.0+rke2r1' } }
      };
      const {
        chartVersions, serverArgs, agentArgs, haveArgInfo, rke2Versions
      } = useKubernetesVersions(props);

      rke2Versions.value = [version('v1.28.0+rke2r1', {
        charts: { 'rke2-ingress-nginx': { version: '1.0.0' } }, serverArgs: { cni: {} }, agentArgs: { foo: 'bar' }
      })];

      expect(chartVersions.value).toStrictEqual({ 'rke2-ingress-nginx': { version: '1.0.0' } });
      expect(serverArgs.value).toStrictEqual({ cni: {} });
      expect(agentArgs.value).toStrictEqual({ foo: 'bar' });
      expect(haveArgInfo.value).toBe(true);
    });

    it('returns empty fallbacks when there is no selected version', () => {
      const {
        chartVersions, serverArgs, agentArgs, haveArgInfo
      } = useKubernetesVersions(baseProps());

      expect(chartVersions.value).toStrictEqual({});
      expect(serverArgs.value).toStrictEqual({});
      expect(agentArgs.value).toStrictEqual({});
      expect(haveArgInfo.value).toBe(false);
    });
  });

  describe('fetchRke2Versions', () => {
    const buildDispatch = ({ channelResponses = {} as Record<string, any[]> } = {}) => {
      return jest.fn((action: string, args: any = {}) => {
        const { url } = args;

        if (action === 'management/request') {
          if (url === '/v1-rke2-release/releases') {
            return Promise.resolve({ data: [{ id: 'v1.28.0+rke2r1', serverArgs: {} }] });
          }
          if (url === '/v1-k3s-release/releases') {
            return Promise.resolve({ data: [{ id: 'v1.28.0+k3s1', serverArgs: {} }] });
          }
          if (url === '/v1-rke2-release/channels') {
            return Promise.resolve({ data: channelResponses.rke2 || [] });
          }
          if (url === '/v1-k3s-release/channels') {
            return Promise.resolve({ data: channelResponses.k3s || [] });
          }
        }

        if (action === 'management/findAll') {
          return Promise.resolve([]);
        }

        return Promise.resolve();
      });
    };

    it('does nothing when versions are already loaded', async() => {
      const { fetchRke2Versions, rke2Versions } = useKubernetesVersions(baseProps());

      rke2Versions.value = [{ id: 'cached' }];

      await fetchRke2Versions();

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('populates versions and default versions from global settings when present', async() => {
      mockDispatch.mockImplementation(buildDispatch());
      mockGetters['management/canList'] = () => false;
      mockGetters['management/all'] = () => [
        { id: 'rke2-default-version', value: 'v1.28.0+rke2r1' },
        { id: 'k3s-default-version', value: 'v1.28.0+k3s1' },
      ];

      const {
        fetchRke2Versions, rke2Versions, k3sVersions, defaultRke2, defaultK3s
      } = useKubernetesVersions(baseProps());

      await fetchRke2Versions();

      expect(rke2Versions.value).toStrictEqual([{ id: 'v1.28.0+rke2r1', serverArgs: {} }]);
      expect(k3sVersions.value).toStrictEqual([{ id: 'v1.28.0+k3s1', serverArgs: {} }]);
      expect(defaultRke2.value).toBe('v1.28.0+rke2r1');
      expect(defaultK3s.value).toBe('v1.28.0+k3s1');
    });

    it('falls back to the default channel latest version when no setting value/default exists', async() => {
      mockDispatch.mockImplementation(buildDispatch({
        channelResponses: {
          rke2: [{ id: 'default', latest: 'v1.29.0+rke2r1' }],
          k3s:  [{ id: 'default', latest: 'v1.29.0+k3s1' }],
        },
      }));
      mockGetters['management/canList'] = () => false;
      mockGetters['management/all'] = () => [];

      const { fetchRke2Versions, defaultRke2, defaultK3s } = useKubernetesVersions(baseProps());

      await fetchRke2Versions();

      expect(defaultRke2.value).toBe('v1.29.0+rke2r1');
      expect(defaultK3s.value).toBe('v1.29.0+k3s1');
    });

    it('throws when no version info is returned for either distro', async() => {
      mockDispatch.mockImplementation((action: string, args: any = {}) => {
        const { url } = args;

        if (url?.includes('/releases') || url?.includes('/channels')) {
          return Promise.resolve({ data: [] });
        }

        return Promise.resolve();
      });
      mockGetters['management/canList'] = () => false;
      mockGetters['management/all'] = () => [];

      const { fetchRke2Versions } = useKubernetesVersions(baseProps());

      await expect(fetchRke2Versions()).rejects.toThrow('No version info found in KDM');
    });
  });
});

describe('getDefaultVersion', () => {
  it('prefers the version matching the defaultRke2 setting when present among version options', () => {
    const result = getDefaultVersion({
      store:             {},
      versionOptions:    [{ value: 'v1.29.0+rke2r1' }, { value: 'v1.28.0+rke2r1' }],
      defaultRke2:       'v1.28.0+rke2r1',
      rke2Versions:      [],
      isHarvesterDriver: false,
    });

    expect(result).toBe('v1.28.0+rke2r1');
  });

  it('falls back to the first version option when defaultRke2 is not among the options', () => {
    const result = getDefaultVersion({
      store:             {},
      versionOptions:    [{ value: 'v1.29.0+rke2r1' }, { value: 'v1.28.0+rke2r1' }],
      defaultRke2:       'v1.99.0+rke2r1',
      rke2Versions:      [],
      isHarvesterDriver: false,
    });

    expect(result).toBe('v1.29.0+rke2r1');
  });

  it('prefers the first Harvester-compatible rke2 version when on the Harvester driver', () => {
    const result = getDefaultVersion({
      store:             {},
      versionOptions:    [{ value: 'v1.29.0+rke2r1' }],
      defaultRke2:       '',
      rke2Versions:      [version('v1.20.0+rke2r1'), version('v1.25.0+rke2r1')],
      isHarvesterDriver: true,
    });

    expect(result).toBe('v1.25.0+rke2r1');
  });

  it('falls back to the preferred/first option when on the Harvester driver but no rke2 versions satisfy it', () => {
    const result = getDefaultVersion({
      store:             {},
      versionOptions:    [{ value: 'v1.29.0+rke2r1' }],
      defaultRke2:       '',
      rke2Versions:      [version('v1.20.0+rke2r1')],
      isHarvesterDriver: true,
    });

    expect(result).toBe('v1.29.0+rke2r1');
  });
});
