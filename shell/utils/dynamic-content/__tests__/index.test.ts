import { fetchAndProcessDynamicContent, fetchDynamicContent } from '../index';
import * as config from '../config';
import * as util from '../util';
import * as newRelease from '../new-release';
import * as supportNotice from '../support-notice';
import * as info from '../info';
import * as typeMap from '@shell/store/type-map';
import * as version from '@shell/config/version';
import * as jsyaml from 'js-yaml';
import dayjs from 'dayjs';
import { Context, DynamicContent } from '../types';

// Mock dependencies
jest.mock('../config');
jest.mock('../util');
jest.mock('../new-release');
jest.mock('../support-notice');
jest.mock('../info');
jest.mock('@shell/store/type-map');
jest.mock('@shell/config/version');
jest.mock('js-yaml');

// Mock dayjs to control time
const mockDayInstance = {
  format:   jest.fn(() => '2023-01-01'),
  add:      jest.fn().mockReturnThis(),
  diff:     jest.fn(() => 100), // a value > 30 for concurrent check
  toString: jest.fn(() => new Date('2023-01-01T12:00:00Z').toString()),
  isAfter:  jest.fn(),
  isValid:  jest.fn(() => true),
};

jest.mock('dayjs', () => ({
  __esModule: true,
  default:    jest.fn((param?: any) => {
    if (param) {
      // If a date is passed, return a mock that wraps it for comparison
      const realDay = jest.requireActual('dayjs')(param);

      return {
        ...mockDayInstance,
        isAfter: (d: any) => realDay.isAfter(d),
        isValid: () => false as any,
      };
    }

    return mockDayInstance;
  })
}));

const mockGetConfig = config.getConfig as jest.Mock;
const mockCreateLogger = util.createLogger as jest.Mock;
const mockProcessReleaseVersion = newRelease.processReleaseVersion as jest.Mock;
const mockProcessSupportNotices = supportNotice.processSupportNotices as jest.Mock;
const mockIsAdminUser = typeMap.isAdminUser as jest.Mock;
const mockGetVersionData = version.getVersionData as jest.Mock;
const mockYamlLoad = jsyaml.load as jest.Mock;
const mockSystemInfoProvider = info.SystemInfoProvider as jest.Mock;

describe('Dynamic Content Index', () => {
  let mockDispatch: jest.Mock;
  let mockGetters: any;
  let mockAxios: jest.Mock;
  let mockLogger: any;
  let mockConfig: any;
  let localStorageMock: any;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockGetters = { 'isSingleProduct': false };
    mockAxios = jest.fn();
    mockLogger = {
      debug: jest.fn(),
      info:  jest.fn(),
      error: jest.fn(),
    };
    mockConfig = {
      enabled: true,
      debug:   false,
      log:     false,
      prime:   false,
      endpoint: '$dist'
    };

    mockGetConfig.mockReturnValue(mockConfig);
    mockCreateLogger.mockReturnValue(mockLogger);
    mockIsAdminUser.mockReturnValue(true);
    mockGetVersionData.mockReturnValue({ Version: '2.9.0', RancherPrime: 'false' });
    mockSystemInfoProvider.mockImplementation(() => ({ buildQueryString: () => 'qs=1' }));

    // Mock localStorage
    let store: { [key: string]: string } = {};

    localStorageMock = {
      getItem:    (key: string) => store[key] || null,
      setItem:    (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    jest.useFakeTimers();

    // Mock console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    localStorageMock.clear();
  });

  describe('fetchAndProcessDynamicContent', () => {
    it('should exit early if in single product mode', async() => {
      mockGetters.isSingleProduct = true;

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);

      jest.runAllTimers();

      await ret;
      expect(mockGetConfig).not.toHaveBeenCalled();
    });

    it('should exit early if dynamic content is disabled', async() => {
      mockConfig.enabled = false;
      await fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);

      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Dynamic content disabled through configuration'); // eslint-disable-line no-console
    });

    it('should exit early if version is invalid', async() => {
      mockGetVersionData.mockReturnValue({ Version: 'invalid' });
      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);

      jest.runAllTimers();

      await ret;
      expect(mockProcessReleaseVersion).not.toHaveBeenCalled();
    });

    it('should process content for community users', async() => {
      const content = { releases: [], support: {} };

      mockAxios.mockResolvedValue({ data: 'yaml: data' });
      mockYamlLoad.mockReturnValue(content);

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);

      jest.runAllTimers();
      await ret;

      expect(mockProcessReleaseVersion).toHaveBeenCalled();
      expect(mockProcessSupportNotices).toHaveBeenCalled();
    });

    it('should process content for prime admin users', async() => {
      mockConfig.prime = true;
      mockIsAdminUser.mockReturnValue(true);
      const content = { releases: [], support: {} };

      mockAxios.mockResolvedValue({ data: 'yaml: data' });
      mockYamlLoad.mockReturnValue(content);

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);
      jest.runAllTimers();
      await ret;

      expect(mockProcessReleaseVersion).toHaveBeenCalled();
      expect(mockProcessSupportNotices).toHaveBeenCalled();
    });

    it('should NOT process content for prime non-admin users', async() => {
      mockConfig.prime = true;
      mockIsAdminUser.mockReturnValue(false);
      const content = { releases: [], support: {} };

      mockAxios.mockResolvedValue({ data: 'yaml: data' });
      mockYamlLoad.mockReturnValue(content);

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);
      jest.runAllTimers();
      await ret;

      expect(mockProcessReleaseVersion).not.toHaveBeenCalled();
      expect(mockProcessSupportNotices).not.toHaveBeenCalled();
    });

    it('should override version if debugVersion is set', async() => {
      const content = { settings: { debugVersion: '2.10.0' } };

      mockAxios.mockResolvedValue({ data: content });
      mockYamlLoad.mockReturnValue(content);

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);
      jest.runAllTimers();
      await ret;

      expect(mockLogger.debug).toHaveBeenCalledWith('Read configuration', {"debug": false, "enabled": true, "endpoint": "$dist", "log": false, "prime": false});
      expect(mockLogger.debug).toHaveBeenCalledWith('Overriding version number to 2.10.0');
      expect(mockProcessReleaseVersion).toHaveBeenCalledWith(
        expect.any(Object),
        undefined,
        expect.objectContaining({ version: expect.objectContaining({ version: '2.10.0' }) })
      );
    });

    it('should clear logs if logging is disabled', async() => {
      mockConfig.log = false;
      localStorageMock.setItem('rancher-updates-debug-log', '[]');
      mockAxios.mockResolvedValue({ data: '' });

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);
      jest.runAllTimers();
      await ret;

      expect(localStorageMock.getItem('rancher-updates-debug-log')).toBeNull();
    });

    it('should handle errors during processing', async() => {
      const error = new Error('Processing failed');

      mockProcessReleaseVersion.mockImplementation(() => {
        throw error;
      });
      mockAxios.mockResolvedValue({ data: '' });

      const ret = fetchAndProcessDynamicContent(mockDispatch, mockGetters, mockAxios);
      jest.runAllTimers();
      await ret;

      expect(mockLogger.error).toHaveBeenCalledWith('Error reading or processing dynamic content', error);
    });
  });

  describe('fetchDynamicContent', () => {
    let context: Context;

    beforeEach(() => {
      context = {
        dispatch: mockDispatch,
        getters:  mockGetters,
        axios:    mockAxios,
        logger:   mockLogger,
        config:   mockConfig,
        isAdmin:  true,
        settings: { releaseNotesUrl: '', suseExtensions: [] },
      };
    });

    it('should fetch and parse content when needed', async() => {
      const content = { version: '1.0' };

      mockAxios.mockResolvedValue({ data: 'yaml: data' });
      mockYamlLoad.mockReturnValue(content);

      const fetchPromise = fetchDynamicContent(context);
      jest.runAllTimers();
      const result = await fetchPromise;

      expect(mockAxios).toHaveBeenCalled();
      expect(mockYamlLoad).toHaveBeenCalledWith('yaml: data');
      expect(result).toEqual(content);
      expect(localStorageMock.getItem('rancher-updates-last-content')).toBe(JSON.stringify(content));
      // Check updateFetchInfo(false) was called
      expect(localStorageMock.getItem('rancher-updates-fetch-next')).toBe('2023-01-02');
      expect(localStorageMock.getItem('rancher-updates-fetch-errors')).toBeNull();
    });

    it('should skip fetch if not due', async() => {
      localStorageMock.setItem('rancher-updates-fetch-next', '2023-01-02');
      await fetchDynamicContent(context);
      expect(mockAxios).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Skipping update check for dynamic content - next check due on 2023-01-02 (today is 2023-01-01)');
    });

    it('should skip fetch if another is in progress', async() => {
      (mockDayInstance.diff as jest.Mock).mockReturnValue(10); // less than 30s
      localStorageMock.setItem('rancher-updates-fetching', new Date('2023-01-01T11:59:55Z').toString());

      await fetchDynamicContent(context);

      expect(mockAxios).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Already fetching dynamic content in another tab (or previous tab closed while fetching) - skipping');
    });

    it('should proceed with fetch if a stale fetch was in progress', async() => {
      (mockDayInstance.diff as jest.Mock).mockReturnValue(100); // more than 30s
      localStorageMock.setItem('rancher-updates-fetching', new Date('2023-01-01T11:00:00Z').toString());
      mockAxios.mockResolvedValue({ data: '' });
      
      const fetchPromise = fetchDynamicContent(context);
      jest.runAllTimers();
      await fetchPromise;

      expect(mockAxios).toHaveBeenCalled();
    });

    it('should handle axios fetch error and backoff', async() => {
      const error = new Error('Network Error');

      mockAxios.mockRejectedValue(error);

      const fetchPromise = fetchDynamicContent(context);
      jest.runAllTimers();
      await fetchPromise;

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred reading dynamic content', error);
      // Check updateFetchInfo(true) was called
      expect(localStorageMock.getItem('rancher-updates-fetch-errors')).toBe('1');
      expect(localStorageMock.getItem('rancher-updates-fetch-next')).toBe('2023-01-02'); // 1 day backoff
    });

    it('should handle YAML parsing error', async() => {
      const error = new Error('YAML Error');

      mockAxios.mockResolvedValue({ data: 'invalid yaml' });
      mockYamlLoad.mockImplementation(() => {
        throw error;
      });

      const fetchPromise = fetchDynamicContent(context);
      jest.runAllTimers();
      await fetchPromise;

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to parse YAML from dynamic content package', error);
      // This also triggers the outer catch, leading to a backoff
      expect(localStorageMock.getItem('rancher-updates-fetch-errors')).toBe('1');
    });

    it('should handle axios fetch error with unexpected data', async() => {
      mockAxios.mockResolvedValue({ data: null });

      const fetchPromise = fetchDynamicContent(context);
      jest.runAllTimers();
      await fetchPromise;

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching dynamic content package (unexpected data)');
      expect(localStorageMock.getItem('rancher-updates-fetch-errors')).toBe('1');
    });

    it('should increment backoff on multiple consecutive errors', async() => {
      const error = new Error('Network Error');

      mockAxios.mockRejectedValue(error);
      localStorageMock.setItem('rancher-updates-fetch-errors', '2'); // 2 previous errors

      const fetchPromise = fetchDynamicContent(context);
      jest.runAllTimers();
      await fetchPromise;

      expect(localStorageMock.getItem('rancher-updates-fetch-errors')).toBe('3');
      // BACKOFFS = [1, 1, 1, 2, 2, 3, 5], index 3 is 2 days
      expect(mockDayInstance.add).toHaveBeenCalledWith(2, 'day');
    });

    it('should cap backoff at max value', async() => {
      const error = new Error('Network Error');

      mockAxios.mockRejectedValue(error);
      localStorageMock.setItem('rancher-updates-fetch-errors', '10'); // more than backoff array length

      await fetchDynamicContent(context);
      jest.runAllTimers();

      // BACKOFFS length is 7, so it should be 6 (length - 1)
      expect(localStorageMock.getItem('rancher-updates-fetch-errors')).toBe('7');
      // BACKOFFS[6] is 5 days
      expect(mockDayInstance.add).toHaveBeenCalledWith(5, 'day');
    });
  });
});