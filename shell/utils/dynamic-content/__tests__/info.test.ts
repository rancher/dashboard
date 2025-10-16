import { SystemInfoProvider } from '../info';
import { MANAGEMENT, COUNT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import * as version from '@shell/config/version';
import { sha256 } from '@shell/utils/crypto';

// Mock dependencies from @shell
jest.mock('@shell/config/version', () => ({
  getVersionData: jest.fn(),
}));

jest.mock('@shell/utils/crypto', () => ({
  sha256: jest.fn((val: string) => `hashed_${val}`),
}));

describe('SystemInfoProvider', () => {
  let mockGetters: any;
  let mockSettings: any[];
  let mockClusters: any[];
  let mockCounts: any;
  let mockPlugins: any[];
  let originalWindowLocation: Location;

  beforeAll(() => {
    originalWindowLocation = window.location;
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { host: 'fallback.host' };
  });

  afterAll(() => {
     (window as any).location = originalWindowLocation;
  });

  beforeEach(() => {
    // Reset mocks
    (version.getVersionData as jest.Mock).mockClear();
    (sha256 as jest.Mock).mockClear();

    // Mock window properties
    Object.defineProperty(window, 'screen', {
      value:    { width: 1920, height: 1080 },
      writable: true
    });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window.navigator, 'language', { value: 'en-US', writable: true });

    mockSettings = [
      { id: SETTING.SERVER_URL, value: 'https://rancher.test' },
      { id: 'install-uuid', value: 'test-uuid' },
    ];

    mockClusters = [
      {
        id:                    'local',
        isLocal:               true,
        kubernetesVersionBase: '1.25',
        provisioner:           'k3s',
        status:                { nodeCount: 3 },
      },
      {
        id:      'c-12345',
        isLocal: false,
      }
    ];

    mockCounts = [{
      counts: {
        [MANAGEMENT.CLUSTER]: { summary: { count: 2 } }
      }
    }];

    mockPlugins = [
      { name: 'harvester', builtin: false },
      { name: 'some-custom-ext', builtin: false },
      { name: 'core', builtin: true },
    ];

    mockGetters = {
      'management/typeRegistered': jest.fn().mockReturnValue(true),
      'management/all':            jest.fn((type: string) => {
        if (type === MANAGEMENT.SETTING) {
          return mockSettings;
        }
        if (type === MANAGEMENT.CLUSTER) {
          return mockClusters;
        }
        if (type === COUNT) {
          return mockCounts;
        }

        return [];
      }),
      'auth/principalId':   'user-123',
      'uiplugins/plugins':  mockPlugins,
      'isSingleProduct':    false,
      'management/byId':    jest.fn(),
      'management/schemaFor': jest.fn(),
    };

    (version.getVersionData as jest.Mock).mockReturnValue({
      Version:      '2.8.0-rc1',
      RancherPrime: 'false',
    });
  });

  it('should build a complete query string with all available data', () => {
    const infoProvider = new SystemInfoProvider(mockGetters, {});
    const qs = infoProvider.buildQueryString();

    expect(qs).toContain('dcv=v1');
    expect(qs).toContain('s=hashed_https://rancher.test');
    expect(qs).toContain('u=hashed_user-123');
    expect(qs).toContain('uuid=test-uuid');
    expect(qs).toContain('v=2.8.0');
    expect(qs).toContain('dev=true');
    expect(qs).toContain('p=false');
    expect(qs).toContain('lts=false');
    expect(qs).toContain('cc=2');
    expect(qs).toContain('lkv=1.25');
    expect(qs).toContain('lcp=k3s');
    expect(qs).toContain('lnc=3');
    expect(qs).toContain('xkn=harvester');
    expect(qs).toContain('xcc=1');
    expect(qs).toContain('bl=en-US');
    expect(qs).toContain('bs=1024x768');
    expect(qs).toContain('ss=1920x1080');
  });

  it('should handle missing or partial data gracefully', () => {
    // Override mocks for this test
    (version.getVersionData as jest.Mock).mockReturnValue({
      Version:      '2.9.0', // Not a dev version
      RancherPrime: 'true',
    });

    mockGetters['management/all'] = jest.fn((type: string) => {
      if (type === MANAGEMENT.SETTING) {
        return [{ id: 'install-uuid', value: 'only-uuid' }]; // No server-url
      }
      if (type === COUNT) {
        return [{
          counts: {
            [MANAGEMENT.CLUSTER]: { summary: { count: 27 } }
          }
        }];
      }
      if (type === MANAGEMENT.CLUSTER) {
        return []; // No clusters
      }

      return [];
    });
    mockGetters['uiplugins/plugins'] = null; // No plugins
    mockGetters['auth/principalId'] = null; // No user

    const infoProvider = new SystemInfoProvider(mockGetters, {});
    const qs = infoProvider.buildQueryString();

    expect(qs).toContain('s=hashed_fallback.host');
    expect(qs).toContain('u=hashed_unknown');
    expect(qs).toContain('uuid=only-uuid');
    expect(qs).toContain('v=2.9.0');
    expect(qs).toContain('dev=false');
    expect(qs).toContain('p=true');
    expect(qs).toContain('cc=27');
    expect(qs).not.toContain('lkv=');
    expect(qs).not.toContain('lcp=');
    expect(qs).not.toContain('lnc=');
    expect(qs).not.toContain('xkn=');
    expect(qs).not.toContain('xcc=');
  });

  it('should handle getAll returning undefined when types are not registered', () => {
    // Override mocks for this test
    (version.getVersionData as jest.Mock).mockReturnValue({
      Version:      '2.9.1',
      RancherPrime: 'false',
    });

    // Simulate that the management types are not registered in the store
    mockGetters['management/typeRegistered'] = jest.fn().mockReturnValue(false);
    mockGetters['management/all'] = jest.fn(); // This should not be called

    mockGetters['auth/principalId'] = 'user-456';
    mockGetters['uiplugins/plugins'] = []; // No plugins

    const infoProvider = new SystemInfoProvider(mockGetters, {});
    const qs = infoProvider.buildQueryString();

    // Verify that 'typeRegistered' was checked and 'all' was not called
    expect(mockGetters['management/typeRegistered']).toHaveBeenCalledWith(MANAGEMENT.SETTING);
    expect(mockGetters['management/typeRegistered']).toHaveBeenCalledWith(COUNT);
    expect(mockGetters['management/typeRegistered']).toHaveBeenCalledWith(MANAGEMENT.CLUSTER);
    expect(mockGetters['management/all']).not.toHaveBeenCalled();

    // Verify the query string is built with fallback or empty values
    expect(qs).toContain('s=hashed_fallback.host');
    expect(qs).toContain('u=hashed_user-456');
    expect(qs).toContain('v=2.9.1');
    expect(qs).toContain('p=false');
    expect(qs).toContain('xcc=0 '); // Note the trailing space from the implementation
    expect(qs).not.toContain('uuid=');
    expect(qs).not.toContain('lkv=');
  });

  it('should use UNKNOWN for missing system properties', () => {
    // Override mocks for this test
    (version.getVersionData as jest.Mock).mockReturnValue({
      Version:      '2.9.0',
      RancherPrime: 'false',
    });

    mockGetters['management/all'] = jest.fn((type: string) => {
      if (type === MANAGEMENT.SETTING) {
        // Return settings, but with empty values
        return [
          { id: SETTING.SERVER_URL, value: '' },
          { id: 'install-uuid', value: '' },
        ];
      }
      if (type === COUNT) {
        return [{ counts: { [MANAGEMENT.CLUSTER]: { summary: { count: 1 } } } }];
      }
      if (type === MANAGEMENT.CLUSTER) {
        // local cluster with missing properties
        return [{
          id:      'local',
          isLocal: true,
          status:  { nodeCount: 1 },
          // kubernetesVersionBase is missing
          // provisioner is missing
        }];
      }

      return [];
    });

    mockGetters['auth/principalId'] = null; // No user

    const infoProvider = new SystemInfoProvider(mockGetters, {});
    const qs = infoProvider.buildQueryString();

    expect(qs).toContain('u=hashed_unknown');
    expect(qs).toContain('lkv=unknown');
    expect(qs).toContain('lcp=unknown');
    expect(qs).not.toContain('uuid='); // systemUUID is UNKNOWN, so it's skipped
  });
});
