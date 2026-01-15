import Socket, {
  STATE_CONNECTING,
  STATE_CONNECTED,
  EVENT_CONNECTING,
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  NO_WATCH,
  NO_SCHEMA,
  NO_PERMS,
  REVISION_TOO_OLD
} from '@shell/utils/socket';

describe('socket constants', () => {
  it('should export state constants', () => {
    expect(STATE_CONNECTING).toBe('connecting');
    expect(STATE_CONNECTED).toBe('connected');
  });

  it('should export event constants', () => {
    expect(EVENT_CONNECTING).toBe('connecting');
    expect(EVENT_CONNECTED).toBe('connected');
    expect(EVENT_DISCONNECTED).toBe('disconnected');
    expect(EVENT_MESSAGE).toBe('message');
  });

  it('should export error type constants', () => {
    expect(NO_WATCH).toBe('NO_WATCH');
    expect(NO_SCHEMA).toBe('NO_SCHEMA');
    expect(NO_PERMS).toBe('NO_PERMS');
    expect(REVISION_TOO_OLD).toBe('TOO_OLD');
  });
});

describe('class: Socket', () => {
  let mockWebSocket: any;
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    originalWebSocket = global.WebSocket;

    mockWebSocket = jest.fn().mockImplementation(() => ({
      send:      jest.fn(),
      close:     jest.fn(),
      onopen:    null,
      onclose:   null,
      onerror:   null,
      onmessage: null
    }));

    (global as any).WebSocket = mockWebSocket;

    Object.defineProperty(global, 'self', {
      value: {
        location: {
          origin:   'http://localhost:8080',
          protocol: 'http:'
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create socket with URL', () => {
      const socket = new Socket('ws://localhost:8080/api');

      expect(socket.url).toBe('ws://localhost:8080/api');
    });

    it('should set autoReconnect to true by default', () => {
      const socket = new Socket('ws://localhost/api');

      expect(socket.autoReconnect).toBe(true);
    });

    it('should allow disabling autoReconnect', () => {
      const socket = new Socket('ws://localhost/api', false);

      expect(socket.autoReconnect).toBe(false);
    });

    it('should set frameTimeout when provided', () => {
      const socket = new Socket('ws://localhost/api', true, 5000);

      expect(socket.frameTimeout).toBe(5000);
    });

    it('should use default frameTimeout of 35000', () => {
      const socket = new Socket('ws://localhost/api');

      expect(socket.frameTimeout).toBe(35000);
    });

    it('should set protocol when provided', () => {
      const socket = new Socket('ws://localhost/api', true, null, 'custom-protocol');

      expect(socket.protocol).toBe('custom-protocol');
    });

    it('should set maxTries when provided', () => {
      const socket = new Socket('ws://localhost/api', true, null, null, 5);

      expect(socket.maxTries).toBe(5);
    });
  });

  describe('setUrl', () => {
    it('should prepend origin when URL is relative', () => {
      const socket = new Socket('/api/socket');

      expect(socket.url).toBe('ws://localhost:8080/api/socket');
    });

    it('should upgrade to wss when on https', () => {
      Object.defineProperty(global, 'self', {
        value: {
          location: {
            origin:   'https://localhost:8080',
            protocol: 'https:'
          }
        },
        writable: true
      });

      const socket = new Socket('ws://localhost:8080/api');

      expect(socket.url).toBe('wss://localhost:8080/api');
    });

    it('should keep wss URL unchanged', () => {
      const socket = new Socket('wss://localhost:8080/api');

      expect(socket.url).toBe('wss://localhost:8080/api');
    });
  });

  describe('isConnected', () => {
    it('should return false when disconnected', () => {
      const socket = new Socket('ws://localhost/api');

      expect(socket.isConnected()).toBe(false);
    });
  });

  describe('send', () => {
    it('should return false when not connected', () => {
      const socket = new Socket('ws://localhost/api');

      const result = socket.send('test');

      expect(result).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return empty object when no socket', () => {
      const socket = new Socket('ws://localhost/api');

      expect(socket.getMetadata()).toStrictEqual({});
    });
  });

  describe('getId', () => {
    it('should return 0 when no socket', () => {
      const socket = new Socket('ws://localhost/api');

      expect(socket.getId()).toBe(0);
    });
  });

  describe('setAutoReconnect', () => {
    it('should update autoReconnect setting', () => {
      const socket = new Socket('ws://localhost/api', true);

      socket.setAutoReconnect(false);

      expect(socket.autoReconnect).toBe(false);
    });
  });

  describe('setAutoReconnectUrl', () => {
    it('should set autoReconnectUrl function', () => {
      const socket = new Socket('ws://localhost/api');
      const urlFn = jest.fn();

      socket.setAutoReconnectUrl(urlFn);

      expect(socket.autoReconnectUrl).toBe(urlFn);
    });
  });

  describe('connect', () => {
    it('should create WebSocket instance', () => {
      const socket = new Socket('ws://localhost:8080/api');

      socket.connect();

      expect(mockWebSocket).toHaveBeenCalledWith(expect.any(String));
    });

    it('should dispatch connecting event', () => {
      const socket = new Socket('ws://localhost:8080/api');
      const handler = jest.fn();

      socket.addEventListener(EVENT_CONNECTING, handler);
      socket.connect();

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: EVENT_CONNECTING }));
    });

    it('should merge metadata on connect', () => {
      const socket = new Socket('ws://localhost:8080/api');

      socket.connect({ foo: 'bar' });

      expect(socket.metadata).toStrictEqual({ foo: 'bar' });
    });

    it('should not create duplicate socket if one exists', () => {
      const socket = new Socket('ws://localhost:8080/api');

      socket.connect();
      socket.connect();

      expect(mockWebSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should return promise that resolves when disconnected', async() => {
      const socket = new Socket('ws://localhost:8080/api');

      const result = await socket.disconnect();

      expect(result).toBeUndefined();
    });

    it('should set autoReconnect to false', async() => {
      const socket = new Socket('ws://localhost:8080/api', true);

      await socket.disconnect();

      expect(socket.autoReconnect).toBe(false);
    });

    it('should add disconnect callback to queue', () => {
      const socket = new Socket('ws://localhost:8080/api');
      const callback = jest.fn();

      socket.disconnect(callback);

      expect(socket.disconnectCallBacks).toContain(callback);
    });
  });

  describe('reconnect', () => {
    it('should merge metadata on reconnect', () => {
      const socket = new Socket('ws://localhost:8080/api');

      socket.reconnect({ newKey: 'newValue' });

      expect(socket.metadata).toStrictEqual({ newKey: 'newValue' });
    });
  });
});
