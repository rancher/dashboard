import { streamJson, streamingSupported } from '@shell/utils/stream';

describe('fx: streamingSupported', () => {
  it('should return true when TextDecoder is available', () => {
    expect(streamingSupported()).toBe(true);
  });

  it('should return false when TextDecoder is not available', () => {
    const originalTextDecoder = global.TextDecoder;

    (global as any).TextDecoder = undefined;

    expect(streamingSupported()).toBe(false);

    global.TextDecoder = originalTextDecoder;
  });
});

describe('fx: streamJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set default method to get', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"data": "test"}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', {}, onData);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ method: 'get' })
    );
  });

  it('should set accept header to application/jsonl', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"data": "test"}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', {}, onData);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ headers: expect.objectContaining({ accept: 'application/jsonl' }) })
    );
  });

  it('should reject with error when status is 400 or higher', async() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status:   404,
      response: {}
    });

    const onData = jest.fn();

    await expect(streamJson('https://example.com/api', {}, onData)).rejects.toStrictEqual(
      expect.objectContaining({ message: 'Error Streaming' })
    );
  });

  it('should call onData for each JSON line', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"id": 1}\n{"id": 2}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', {}, onData);

    expect(onData).toHaveBeenCalledTimes(2);
    const calls = onData.mock.calls.map((c: any[]) => c[0]);

    expect(calls).toContainEqual({ id: 1 });
    expect(calls).toContainEqual({ id: 2 });
  });

  it('should handle multiple chunks of data', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"chunk": 1}'),
          done:  false
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('\n{"chunk": 2}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', {}, onData);

    expect(onData).toHaveBeenCalledTimes(2);
    const calls = onData.mock.calls.map((c: any[]) => c[0]);

    expect(calls).toContainEqual({ chunk: 1 });
    expect(calls).toContainEqual({ chunk: 2 });
  });

  it('should preserve existing headers', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"data": "test"}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', { headers: { authorization: 'Bearer token' } }, onData);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer token',
          accept:        'application/jsonl'
        })
      })
    );
  });

  it('should use provided method', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"data": "test"}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', { method: 'post' }, onData);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ method: 'post' })
    );
  });

  it('should handle null options', async() => {
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('{"data": "test"}'),
          done:  false
        })
        .mockResolvedValueOnce({
          done:  true,
          value: undefined
        })
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      body:   { getReader: () => mockReader }
    });

    const onData = jest.fn();

    await streamJson('https://example.com/api', null, onData);

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', expect.any(Object));
    expect(onData).toHaveBeenCalledWith({ data: 'test' });
  });
});
