import { SteveWatchEventListenerManager } from '@shell/plugins/subscribe-events';
import { STEVE_WATCH_EVENT_TYPES } from '@shell/types/store/subscribe.types';

// Mock function to create a consistent key for testing
const mockKeyForSubscribe = jest.fn(({
  params: {
    type, name, id, selector, mode
  }
}) => {
  return `${ type }-${ name }-${ id }-${ selector }-${ mode }`;
});

// Mock parameters and callbacks
const mockParams1 = {
  type: 'pods', name: 'my-pod', id: 'abc-123', selector: 'app=test'
};
const mockCallback1 = jest.fn();
const mockCallback2 = jest.fn();

// The class under test
let manager: SteveWatchEventListenerManager;

describe('steveWatchEventListenerManager', () => {
  beforeEach(() => {
    // Reset the manager and mocks before each test
    manager = new SteveWatchEventListenerManager();
    jest.clearAllMocks();
    // Replace the internal keyForSubscribe with our mock
    (manager as any).keyForSubscribe = mockKeyForSubscribe;
  });

  describe('initialization and Properties', () => {
    it('should be created successfully', () => {
      expect(manager).toBeInstanceOf(SteveWatchEventListenerManager);
    });

    it('should have a supportedEventTypes array with STEVE_WATCH_EVENT_TYPES.CHANGES', () => {
      expect(manager.supportedEventTypes).toStrictEqual([STEVE_WATCH_EVENT_TYPES.CHANGES]);
    });

    it('should correctly identify a supported event type', () => {
      const isSupported = manager.isSupportedEventType(STEVE_WATCH_EVENT_TYPES.CHANGES);

      expect(isSupported).toBe(true);
    });

    it('should correctly identify an unsupported event type', () => {
      const isSupported = manager.isSupportedEventType('some.other.event' as STEVE_WATCH_EVENT_TYPES);

      expect(isSupported).toBe(false);
    });
  });

  describe('watch Management', () => {
    it('should return undefined when getting a non-existent watch', () => {
      const watch = manager.getWatch({ params: mockParams1 });

      expect(watch).toBeUndefined();
    });

    it('should create a watch when setStandardWatch is called with standardWatch true and no watch exists', () => {
      manager.setStandardWatch({ standardWatch: true, args: { params: mockParams1 } });
      const watch = (manager as any).watches[mockKeyForSubscribe({ params: mockParams1 })];

      expect(watch).toBeDefined();
      expect(watch.hasStandardWatch).toBe(true);
      expect(watch.listeners).toStrictEqual([]);
    });

    it('should not create a watch when setStandardWatch is called with standardWatch false and no watch exists', () => {
      manager.setStandardWatch({ standardWatch: false, args: { params: mockParams1 } });
      const watch = (manager as any).watches[mockKeyForSubscribe({ params: mockParams1 })];

      expect(watch).toBeUndefined();
    });

    it('should delete a watch when hasStandardWatch becomes false and there are no listeners', () => {
      manager.setStandardWatch({ standardWatch: true, args: { params: mockParams1 } });
      manager.setStandardWatch({ standardWatch: false, args: { params: mockParams1 } });
      const watch = (manager as any).watches[mockKeyForSubscribe({ params: mockParams1 })];

      expect(watch).toBeUndefined();
    });
  });

  describe('listener and Callback Management', () => {
    it('should add a new listener and a callback', () => {
      const listener = manager.addEventListenerCallback({
        callback: mockCallback1,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-1'
        }
      });

      expect(listener).toBeDefined();
      expect(listener.event).toBe(STEVE_WATCH_EVENT_TYPES.CHANGES);
      expect(listener.callbacks['cb-1']).toBe(mockCallback1);
      const watch = manager.getWatch({ params: mockParams1 });

      expect(watch?.listeners.length).toBe(1);
    });

    it('should add a second callback to an existing listener', () => {
      manager.addEventListenerCallback({
        callback: mockCallback1,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-1'
        }
      });
      manager.addEventListenerCallback({
        callback: mockCallback2,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-2'
        }
      });

      const listener = manager.getEventListener({ args: { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params: mockParams1 } });

      expect(Object.keys(listener?.callbacks || {})).toHaveLength(2);
      expect(listener?.callbacks['cb-2']).toBe(mockCallback2);
    });

    it('should trigger a specific event listener and its callbacks', () => {
      manager.addEventListenerCallback({
        callback: mockCallback1,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-1'
        }
      });
      manager.addEventListenerCallback({
        callback: mockCallback2,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-2'
        }
      });

      manager.triggerEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params: mockParams1 });
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });

    it('should remove a specific callback from a listener', () => {
      manager.addEventListenerCallback({
        callback: mockCallback1,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-1'
        }
      });
      manager.removeEventListenerCallback({
        event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
        params: mockParams1,
        id:     'cb-1'
      });
      const listener = manager.getEventListener({ args: { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params: mockParams1 } });

      expect(listener?.callbacks['cb-1']).toBeUndefined();
    });

    it('should trigger all callbacks for a given watch', () => {
      manager.addEventListenerCallback({
        callback: mockCallback1,
        args:     {
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: mockParams1,
          id:     'cb-1'
        }
      });
      manager.addEventListenerCallback({
        callback: mockCallback2,
        args:     {
          event:  'another.event' as STEVE_WATCH_EVENT_TYPES,
          params: mockParams1,
          id:     'cb-2'
        }
      });

      manager.triggerAllEventListeners({ params: mockParams1 });
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });
});
