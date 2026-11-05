/**
 * Tests for the reconnecting-websocket wrapper `Socket`.
 *
 * A minimal mock `WebSocket` is installed on `global.WebSocket` so tests can
 * deterministically trigger `onopen`/`onerror`/`onclose`/`onmessage` without a real
 * network connection, and fake timers control the watchdog + reconnect-backoff delays.
 */

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  protocol?: string;
  sockId?: number;
  metadata?: Record<string, unknown>;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code?: number; reason?: string; wasClean?: boolean }) => void) | null = null;
  onmessage: ((event: unknown) => void) | null = null;
  closeCalled = false;

  constructor(url: string, protocol?: string) {
    this.url = url;
    this.protocol = protocol;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.closeCalled = true;
  }
}

describe('socket.js', () => {
  let Socket: any;
  let EVENT_CONNECTING: string;
  let EVENT_CONNECTED: string;
  let EVENT_MESSAGE: string;
  let EVENT_FRAME_TIMEOUT: string;
  let EVENT_CONNECT_ERROR: string;
  let EVENT_DISCONNECT_ERROR: string;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    MockWebSocket.instances = [];
    (global as any).WebSocket = MockWebSocket;

    // eslint-disable-next-line global-require
    const mod = require('@shell/utils/socket');

    Socket = mod.default;
    ({
      EVENT_CONNECTING, EVENT_CONNECTED, EVENT_MESSAGE, EVENT_FRAME_TIMEOUT, EVENT_CONNECT_ERROR, EVENT_DISCONNECT_ERROR
    } = mod);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('setUrl', () => {
    it.each([
      {
        desc:     'leaves already-prefixed ws:// urls untouched under http',
        protocol: 'http:',
        input:    'ws://example.test/foo',
        expected: 'ws://example.test/foo',
      },
      {
        desc:     'prefixes a relative path with ws:// derived from location.origin under http',
        protocol: 'http:',
        input:    '/foo',
        expected: 'ws://localhost/foo',
      },
      {
        desc:     'upgrades an insecure ws:// url to wss:// under https',
        protocol: 'https:',
        input:    'ws://example.test/foo',
        expected: 'wss://example.test/foo',
      },
      {
        desc:     'leaves an already-secure wss:// url untouched under https',
        protocol: 'https:',
        input:    'wss://example.test/foo',
        expected: 'wss://example.test/foo',
      },
    ])('$desc', ({ protocol, input, expected }) => {
      const originalLocation = window.location;

      delete (window as any).location;
      (window as any).location = { ...originalLocation, protocol };

      const socket = new Socket(input);

      expect(socket.url).toBe(expected);

      (window as any).location = originalLocation;
    });
  });

  describe('connect', () => {
    it('creates a WebSocket without a protocol and dispatches EVENT_CONNECTING', () => {
      const socket = new Socket('/foo');
      const listener = jest.fn();

      socket.addEventListener(EVENT_CONNECTING, listener);
      socket.connect();

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].protocol).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('creates a WebSocket with the configured protocol', () => {
      const socket = new Socket('/foo', true, null, 'my-protocol');

      socket.connect();

      expect(MockWebSocket.instances[0].protocol).toBe('my-protocol');
    });

    it('refuses to connect while another socket already exists', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const socket = new Socket('/foo');

      socket.connect();
      socket.connect();

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('Socket refusing to connect while another socket exists');
    });

    it('merges provided metadata onto the socket instance', () => {
      const socket = new Socket('/foo');

      socket.connect({ clusterId: 'c-123' });

      expect(MockWebSocket.instances[0].metadata).toStrictEqual({ clusterId: 'c-123' });
    });
  });

  describe('send', () => {
    it('returns false and does not call socket.send when not connected', () => {
      const socket = new Socket('/foo');

      socket.connect();
      const sendSpy = jest.fn();

      (MockWebSocket.instances[0] as any).send = sendSpy;

      const result = socket.send('hello');

      expect(result).toBe(false);
      expect(sendSpy).toHaveBeenCalledTimes(0);
    });

    it('sends data and returns true once connected', () => {
      const socket = new Socket('/foo');

      socket.connect();

      const ws = MockWebSocket.instances[0] as any;

      ws.send = jest.fn();
      ws.onopen();

      const result = socket.send('hello');

      expect(result).toBe(true);
      expect(ws.send).toHaveBeenCalledWith('hello');
    });
  });

  describe('_opened', () => {
    it('dispatches EVENT_CONNECTED with tries and afterMilliseconds on first open', () => {
      const socket = new Socket('/foo');
      const listener = jest.fn();

      socket.addEventListener(EVENT_CONNECTED, listener);
      socket.connect();
      MockWebSocket.instances[0].onopen!();

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];

      expect(event.detail).toStrictEqual({ tries: 1, afterMilliseconds: 0 });
      expect(socket.isConnected()).toBe(true);
      expect(socket.hasReconnected).toBe(false);
    });

    it('marks hasReconnected true on a second open', () => {
      const socket = new Socket('/foo');

      socket.connect();
      MockWebSocket.instances[0].onopen!();
      MockWebSocket.instances[0].onclose!({
        code: 1000, reason: '', wasClean: true
      });
      jest.advanceTimersByTime(1000);
      MockWebSocket.instances[1].onopen!();

      expect(socket.hasReconnected).toBe(true);
    });
  });

  describe('_onmessage', () => {
    it('increments framesReceived and dispatches EVENT_MESSAGE with the raw event', () => {
      const socket = new Socket('/foo');
      const listener = jest.fn();

      socket.addEventListener(EVENT_MESSAGE, listener);
      socket.connect();
      MockWebSocket.instances[0].onopen!();
      MockWebSocket.instances[0].onmessage!({ data: 'payload' });

      expect(socket.framesReceived).toBe(1);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].detail).toStrictEqual({ data: 'payload' });
    });
  });

  describe('watchdog (frame timeout)', () => {
    it('closes the socket and dispatches EVENT_FRAME_TIMEOUT when no frames arrive in time', () => {
      const socket = new Socket('/foo', true, 5000);
      const listener = jest.fn();

      socket.addEventListener(EVENT_FRAME_TIMEOUT, listener);
      socket.connect();
      MockWebSocket.instances[0].onopen!();

      jest.advanceTimersByTime(5000);

      expect(MockWebSocket.instances[0].closeCalled).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('resets the watchdog timer whenever a message is received', () => {
      const socket = new Socket('/foo', true, 5000);

      socket.connect();
      MockWebSocket.instances[0].onopen!();

      jest.advanceTimersByTime(4000);
      MockWebSocket.instances[0].onmessage!({});
      jest.advanceTimersByTime(4000);

      expect(MockWebSocket.instances[0].closeCalled).toBe(false);
    });
  });

  describe('_closed reconnect behaviour', () => {
    it('dispatches EVENT_CONNECT_ERROR and disables autoReconnect on the very first failed close (never connected)', () => {
      const socket = new Socket('/foo');
      const listener = jest.fn();

      socket.addEventListener(EVENT_CONNECT_ERROR, listener);
      socket.connect();
      MockWebSocket.instances[0].onclose!({
        code: 1006, reason: 'fail', wasClean: false
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(socket.autoReconnect).toBe(false);
      expect(socket.state).toBe('disconnected');
    });

    it('schedules a reconnect after a clean disconnect once previously connected', () => {
      const socket = new Socket('/foo');

      socket.connect();
      MockWebSocket.instances[0].onopen!();
      MockWebSocket.instances[0].onclose!({
        code: 1000, reason: '', wasClean: true
      });

      expect(socket.state).toBe('reconnecting');

      jest.advanceTimersByTime(1000);

      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('gives up and dispatches EVENT_DISCONNECT_ERROR once maxTries is exceeded', () => {
      const socket = new Socket('/foo', true, null, null, 1);
      const disconnectListener = jest.fn();

      socket.addEventListener(EVENT_DISCONNECT_ERROR, disconnectListener);

      socket.connect();
      MockWebSocket.instances[0].onopen!();
      MockWebSocket.instances[0].onclose!({
        code: 1006, reason: '', wasClean: false
      });
      jest.advanceTimersByTime(1000);

      MockWebSocket.instances[1].onclose!({
        code: 1006, reason: '', wasClean: false
      });
      jest.advanceTimersByTime(1000);

      MockWebSocket.instances[2].onclose!({
        code: 1006, reason: '', wasClean: false
      });

      expect(socket.state).toBe('disconnected');
      expect(disconnectListener).toHaveBeenCalledTimes(1);
    });

    it('does not reconnect when autoReconnect has been disabled', () => {
      const socket = new Socket('/foo');

      socket.connect();
      MockWebSocket.instances[0].onopen!();
      socket.setAutoReconnect(false);
      MockWebSocket.instances[0].onclose!({
        code: 1000, reason: '', wasClean: true
      });

      expect(socket.state).toBe('disconnected');

      jest.advanceTimersByTime(30000);
      expect(MockWebSocket.instances).toHaveLength(1);
    });
  });

  describe('disconnect', () => {
    it('resolves immediately when already disconnected', async() => {
      const socket = new Socket('/foo');

      await expect(socket.disconnect()).resolves.toBeUndefined();
    });

    it('closes the underlying socket and disables autoReconnect', () => {
      const socket = new Socket('/foo');

      socket.connect();
      MockWebSocket.instances[0].onopen!();
      socket.disconnect();

      expect(socket.autoReconnect).toBe(false);
      expect(MockWebSocket.instances[0].closeCalled).toBe(true);
    });
  });

  describe('reconnect', () => {
    it('is a no-op while a connection attempt is already in progress', () => {
      const socket = new Socket('/foo');

      socket.connect();
      socket.reconnect();

      expect(MockWebSocket.instances).toHaveLength(1);
    });

    it('closes the existing socket when one is present', () => {
      const socket = new Socket('/foo');

      socket.connect();
      MockWebSocket.instances[0].onopen!();
      socket.reconnect();

      expect(MockWebSocket.instances[0].closeCalled).toBe(true);
    });

    it('connects directly when no socket currently exists', () => {
      const socket = new Socket('/foo');

      socket.reconnect({ clusterId: 'c-1' });

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].metadata).toStrictEqual({ clusterId: 'c-1' });
    });
  });

  describe('getMetadata / getId', () => {
    it('returns empty metadata and id 0 when there is no active socket', () => {
      const socket = new Socket('/foo');

      expect(socket.getMetadata()).toStrictEqual({});
      expect(socket.getId()).toBe(0);
    });

    it('returns the underlying socket metadata and sockId once connected', () => {
      const socket = new Socket('/foo');

      socket.connect({ foo: 'bar' });

      expect(socket.getMetadata()).toStrictEqual({ foo: 'bar' });
      expect(socket.getId()).toBe(MockWebSocket.instances[0].sockId);
    });
  });
});
