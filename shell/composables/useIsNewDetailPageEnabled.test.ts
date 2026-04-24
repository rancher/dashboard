import { useIsNewDetailPageEnabled } from '@shell/composables/useIsNewDetailPageEnabled';

const mockStore: any = { getters: {} };
const mockRoute: any = { query: {} };

jest.mock('vuex', () => ({ useStore: () => mockStore }));
jest.mock('vue-router', () => ({ useRoute: () => mockRoute }));

const mockGetVersionInfo = jest.fn(() => ({ fullVersion: '2.12.0' }));

jest.mock('@shell/utils/version', () => ({ getVersionInfo: (...args: any[]) => mockGetVersionInfo(...args) }));

describe('useIsNewDetailPageEnabled', () => {
  beforeEach(() => {
    mockRoute.query = {};
    mockGetVersionInfo.mockReturnValue({ fullVersion: '2.12.0' });
  });

  describe('version gating', () => {
    it('should return false when version is below 2.12.0', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: '2.11.9' });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(false);
    });

    it('should return false when version is 2.10.0', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: '2.10.0' });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(false);
    });

    it('should return true when version is exactly 2.12.0 and no legacy query', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: '2.12.0' });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(true);
    });

    it('should return true when version is above 2.12.0', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: '2.13.0' });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(true);
    });

    it('should return false when version is undefined', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: undefined });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(false);
    });

    it('should return false when version is null', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: null });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(false);
    });

    it('should handle pre-release version strings', () => {
      mockGetVersionInfo.mockReturnValue({ fullVersion: 'v2.12.1-rc1' });
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(true);
    });
  });

  describe('legacy query param (with version >= 2.12.0)', () => {
    it('should return true when no legacy query param is present', () => {
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(true);
    });

    it('should return false when legacy query param is "true"', () => {
      mockRoute.query = { legacy: 'true' };
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(false);
    });

    it('should return true when legacy query param is "false"', () => {
      mockRoute.query = { legacy: 'false' };
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(true);
    });

    it('should return true when legacy query param has an unexpected value', () => {
      mockRoute.query = { legacy: 'something' };
      const result = useIsNewDetailPageEnabled();

      expect(result.value).toBe(true);
    });
  });
});
