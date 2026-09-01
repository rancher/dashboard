import type { useRuntimeFlag as UseRuntimeFlagFn } from '@shell/composables/useRuntimeFlag';

describe('useRuntimeFlag', () => {
  let mockGetVersionInfo: jest.Mock;
  let useRuntimeFlag: typeof UseRuntimeFlagFn;
  const mockStore = {} as any;

  beforeEach(() => {
    mockGetVersionInfo = jest.fn();
    jest.resetModules();
    jest.mock('@shell/utils/version', () => ({ getVersionInfo: mockGetVersionInfo }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    useRuntimeFlag = require('@shell/composables/useRuntimeFlag').useRuntimeFlag;
  });

  describe('featureDropdownMenu', () => {
    it.each([
      {
        desc:        'version equal to minimum 2.11.0',
        fullVersion: '2.11.0',
        expected:    true,
      },
      {
        desc:        'patch release above minimum',
        fullVersion: '2.11.1',
        expected:    true,
      },
      {
        desc:        'minor release above minimum',
        fullVersion: '2.12.0',
        expected:    true,
      },
      {
        desc:        'major release above minimum',
        fullVersion: '3.0.0',
        expected:    true,
      },
      {
        desc:        'patch release just below minimum',
        fullVersion: '2.10.9',
        expected:    false,
      },
      {
        desc:        'minor release below minimum',
        fullVersion: '2.10.0',
        expected:    false,
      },
      {
        desc:        'version well below minimum',
        fullVersion: '1.0.0',
        expected:    false,
      },
      {
        desc:        'version with v prefix equal to minimum',
        fullVersion: 'v2.11.0',
        expected:    true,
      },
      {
        desc:        'pre-release version coerced to minimum',
        fullVersion: '2.11.0-rc1',
        expected:    true,
      },
      {
        desc:        'pre-release version below minimum',
        fullVersion: '2.10.9-rc1',
        expected:    false,
      },
      {
        desc:        'non-semver string falls back to 0.0.0',
        fullVersion: 'unknown',
        expected:    false,
      },
      {
        desc:        'empty string falls back to 0.0.0',
        fullVersion: '',
        expected:    false,
      },
    ])('returns $expected when $desc', ({ fullVersion, expected }) => {
      mockGetVersionInfo.mockReturnValue({ fullVersion, displayVersion: fullVersion });
      const { featureDropdownMenu } = useRuntimeFlag(mockStore);

      expect(featureDropdownMenu.value).toStrictEqual(expected);
    });
  });

  it('returns object with featureDropdownMenu property', () => {
    mockGetVersionInfo.mockReturnValue({ fullVersion: '2.11.0', displayVersion: '2.11.0' });
    const result = useRuntimeFlag(mockStore);

    expect(result).toHaveProperty('featureDropdownMenu');
  });
});
