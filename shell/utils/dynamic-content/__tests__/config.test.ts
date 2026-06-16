import { getConfig } from '../config';
import { SETTING } from '@shell/config/settings';
import * as version from '@shell/config/version';

const DEFAULT_ENDPOINT = 'https://updates.rancher.io/rancher/$dist/updates';

// Mock dependencies
jest.mock('@shell/config/version', () => ({ getVersionData: jest.fn(), isRancherPrime: jest.fn() }));

describe('getConfig', () => {
  let mockGetters: any;

  beforeEach(() => {
    // Reset mocks before each test
    (version.getVersionData as jest.Mock).mockClear();
    (version.isRancherPrime as jest.Mock).mockClear();

    // Default mock for getters
    mockGetters = { 'management/byId': jest.fn() };
  });

  describe('community distribution', () => {
    beforeEach(() => {
      (version.getVersionData as jest.Mock).mockReturnValue({ RancherPrime: 'false' });
      (version.isRancherPrime as jest.Mock).mockReturnValue(false);
    });

    it('should return default community config when no settings are present', () => {
      mockGetters['management/byId'].mockReturnValue(null);
      const config = getConfig(mockGetters);

      expect(config.prime).toBe(false);
      expect(config.distribution).toBe('community');
      expect(config.endpoint).toBe(DEFAULT_ENDPOINT);
      expect(config.enabled).toBe(true);
      expect(config.debug).toBe(false);
      expect(config.log).toBe(false);
    });

    it('should enable debug and log modes when enabled setting is "debug"', () => {
      mockGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (id === SETTING.DYNAMIC_CONTENT_ENABLED) {
          return { value: 'debug' };
        }
        if (id === SETTING.DYNAMIC_CONTENT_ENDPOINT) {
          return { value: 'https://test.endpoint' };
        }

        return null;
      });

      const config = getConfig(mockGetters);

      expect(config.enabled).toBe(true);
      expect(config.debug).toBe(true);
      expect(config.log).toBe(true);
    });

    it('should enable log mode when enabled setting is "log"', () => {
      mockGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (id === SETTING.DYNAMIC_CONTENT_ENABLED) {
          return { value: 'log' };
        }
        if (id === SETTING.DYNAMIC_CONTENT_ENDPOINT) {
          return { value: 'https://test.endpoint' };
        }

        return null;
      });

      const config = getConfig(mockGetters);

      expect(config.enabled).toBe(true);
      expect(config.debug).toBe(false);
      expect(config.log).toBe(true);
    });

    it('should not use the endpoint from settings when community', () => {
      mockGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (id === SETTING.DYNAMIC_CONTENT_ENDPOINT) {
          return { value: 'https://custom.endpoint/rancher/$dist' };
        }

        return null;
      });

      const config = getConfig(mockGetters);

      expect(config.endpoint).toBe(DEFAULT_ENDPOINT);
      expect(config.enabled).toBe(true);
    });
  });

  describe('prime distribution', () => {
    beforeEach(() => {
      (version.getVersionData as jest.Mock).mockReturnValue({ RancherPrime: 'true' });
      (version.isRancherPrime as jest.Mock).mockReturnValue(true);
    });

    it('should return default prime config when no settings are present', () => {
      mockGetters['management/byId'].mockReturnValue(null);
      const config = getConfig(mockGetters);

      expect(config.prime).toBe(true);
      expect(config.distribution).toBe('prime');
      expect(config.endpoint).toBe(DEFAULT_ENDPOINT);
      expect(config.enabled).toBe(true);
    });

    it('should be disabled when the setting is "false"', () => {
      mockGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (id === SETTING.DYNAMIC_CONTENT_ENABLED) {
          return { value: 'false' };
        }
        if (id === SETTING.DYNAMIC_CONTENT_ENDPOINT) {
          return { value: 'https://test.endpoint' };
        }

        return null;
      });

      const config = getConfig(mockGetters);

      expect(config.enabled).toBe(false);
    });

    it('should be enabled when the setting is "true"', () => {
      mockGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (id === SETTING.DYNAMIC_CONTENT_ENABLED) {
          return { value: 'true' };
        }
        if (id === SETTING.DYNAMIC_CONTENT_ENDPOINT) {
          return { value: 'https://test.endpoint' };
        }

        return null;
      });

      const config = getConfig(mockGetters);

      expect(config.enabled).toBe(true);
    });

    it('should NOT use the endpoint from settings if it is not a valid HTTPS URL', () => {
      mockGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (id === SETTING.DYNAMIC_CONTENT_ENDPOINT) {
          return { value: 'http://insecure.endpoint/rancher/$dist' };
        }

        return null;
      });

      const config = getConfig(mockGetters);

      expect(config.endpoint).toBe(DEFAULT_ENDPOINT); // Falls back to default
      expect(config.enabled).toBe(true);
    });
  });

  describe('general', () => {
    it('should handle exceptions when reading settings and return defaults', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Something went wrong');

      (version.getVersionData as jest.Mock).mockReturnValue({ RancherPrime: 'false' });
      (version.isRancherPrime as jest.Mock).mockReturnValue(false);
      mockGetters['management/byId'].mockImplementation(() => {
        throw testError;
      });

      const config = getConfig(mockGetters);

      // It should fall back to the default configuration
      expect(config.prime).toBe(false);
      expect(config.distribution).toBe('community');
      expect(config.endpoint).toBe(DEFAULT_ENDPOINT);
      expect(config.enabled).toBe(true);
      expect(config.debug).toBe(false);
      expect(config.log).toBe(false);

      // And it should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading dynamic content settings', testError);

      consoleErrorSpy.mockRestore();
    });
  });
});
