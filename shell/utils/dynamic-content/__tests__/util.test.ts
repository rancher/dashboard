import { removeMatchingNotifications, createLogger, LOCAL_STORAGE_CONTENT_DEBUG_LOG } from '../util';
import { Context, Configuration } from '../types';

describe('util.ts', () => {
  describe('removeMatchingNotifications', () => {
    let mockContext: Context;
    let mockDispatch: jest.Mock;
    let mockGetters: any;
    let mockLogger: any;

    beforeEach(() => {
      mockDispatch = jest.fn();
      mockGetters = { 'notifications/all': [] };
      mockLogger = { debug: jest.fn() };
      mockContext = {
        dispatch: mockDispatch,
        getters:  mockGetters,
        logger:   mockLogger,
        // The following properties are not used by this function but are required by the type
        axios:    {},
        isAdmin:  true,
        config:   {} as any,
        settings: {} as any,
      };
    });

    it('should return false and not remove anything if no notifications exist', async() => {
      const found = await removeMatchingNotifications(mockContext, 'prefix-', 'current');

      expect(found).toBe(false);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should return false and not remove anything if no notifications match the prefix', async() => {
      mockGetters['notifications/all'] = [
        { id: 'other-1' },
        { id: 'other-2' },
      ];
      const found = await removeMatchingNotifications(mockContext, 'prefix-', 'current');

      expect(found).toBe(false);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should return true and not remove anything if the current notification is the only one matching', async() => {
      mockGetters['notifications/all'] = [
        { id: 'prefix-current' },
        { id: 'other-1' },
      ];
      const found = await removeMatchingNotifications(mockContext, 'prefix-', 'current');

      expect(found).toBe(true);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should return false and remove a notification that matches the prefix but not the currentId', async() => {
      mockGetters['notifications/all'] = [
        { id: 'prefix-old' },
        { id: 'other-1' },
      ];
      const found = await removeMatchingNotifications(mockContext, 'prefix-', 'current');

      expect(found).toBe(false);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith('notifications/remove', 'prefix-old');
    });

    it('should return true and remove old notifications when the current one also exists', async() => {
      mockGetters['notifications/all'] = [
        { id: 'prefix-old-1' },
        { id: 'prefix-current' },
        { id: 'prefix-old-2' },
        { id: 'other-1' },
      ];
      const found = await removeMatchingNotifications(mockContext, 'prefix-', 'current');

      expect(found).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenCalledWith('notifications/remove', 'prefix-old-1');
      expect(mockDispatch).toHaveBeenCalledWith('notifications/remove', 'prefix-old-2');
    });
  });

  describe('createLogger / log', () => {
    let mockLocalStorage: { [key: string]: string };
    let consoleErrorSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;
    let dispatchEventSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock localStorage
      mockLocalStorage = {};
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockLocalStorage[key] || null);
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        mockLocalStorage[key] = value;
      });

      // Mock console
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

      // Mock dispatchEvent
      dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should always log errors to console, but only to localStorage if config.log is true', () => {
      const config: Configuration = {
        enabled: true, debug: false, log: false, endpoint: '', prime: false, distribution: 'community'
      };
      const logger = createLogger(config);

      logger.error('test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith('test error');
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeUndefined();

      // Test with arg
      logger.error('test error', 'with arg');

      expect(consoleErrorSpy).toHaveBeenCalledWith('test error', 'with arg');
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeUndefined();

      config.log = true;

      logger.error('test error with log');

      expect(consoleErrorSpy).toHaveBeenCalledWith('test error with log');
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeDefined();
      expect(JSON.parse(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG])[0].message).toBe('test error with log');
    });

    it('should log info to console and localStorage only if config.log is true', () => {
      const config: Configuration = {
        enabled: true, debug: false, log: false, endpoint: '', prime: false, distribution: 'community'
      };
      const logger = createLogger(config);

      logger.info('test info');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeUndefined();

      config.log = true;
      logger.info('test info with log');

      expect(consoleInfoSpy).toHaveBeenCalledWith('test info with log');
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeDefined();
      expect(JSON.parse(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG])[0].message).toBe('test info with log');

      // Test with arg
      logger.info('test info', 'with arg');

      expect(consoleInfoSpy).toHaveBeenCalledWith('test info', 'with arg');
    });

    it('should log debug to console only if config.debug is true, and localStorage if config.log is true', () => {
      const config: Configuration = {
        enabled: true, debug: false, log: false, endpoint: '', prime: false, distribution: 'community'
      };
      const logger = createLogger(config);

      logger.debug('test debug');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeUndefined();

      config.log = true;
      logger.debug('test debug with log');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]).toBeDefined();
      expect(JSON.parse(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG])[0].message).toBe('test debug with log');

      config.debug = true;
      logger.debug('test debug with debug and log');
      expect(consoleDebugSpy).toHaveBeenCalledWith('test debug with debug and log');
    });

    it('should dispatch a custom event when logging to localStorage', () => {
      const config: Configuration = {
        enabled: true, debug: false, log: true, endpoint: '', prime: false, distribution: 'community'
      };
      const logger = createLogger(config);

      logger.info('test event');

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;

      expect(event.type).toBe('dynamicContentLog');
      expect(event.detail.message).toBe('test event');
    });

    it('should limit the number of log messages in localStorage', () => {
      const config: Configuration = {
        enabled: true, debug: false, log: true, endpoint: '', prime: false, distribution: 'community'
      };
      const logger = createLogger(config);

      // MAX_LOG_MESSAGES is 50
      for (let i = 0; i < 60; i++) {
        logger.info(`message ${ i }`);
      }

      const logs = JSON.parse(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]);

      expect(logs).toHaveLength(50);
      expect(logs[0].message).toBe('message 59'); // Most recent
      expect(logs[49].message).toBe('message 10'); // Oldest
    });

    it('should not throw if localStorage is corrupted', () => {
      const config: Configuration = {
        enabled: true, debug: false, log: true, endpoint: '', prime: false, distribution: 'community'
      };
      const logger = createLogger(config);

      mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG] = 'this is not valid json';

      expect(() => {
        logger.info('test message');
      }).not.toThrow();

      // It should have overwritten the bad data
      const logs = JSON.parse(mockLocalStorage[LOCAL_STORAGE_CONTENT_DEBUG_LOG]);

      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('test message');
    });
  });
});
