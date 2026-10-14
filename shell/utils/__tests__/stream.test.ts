import { streamJson, streamingSupported } from '@shell/utils/stream';

function makeReader(chunks: (Uint8Array | undefined)[]) {
  let i = 0;

  return {
    read: jest.fn(() => {
      if (i >= chunks.length) {
        return Promise.resolve({ value: undefined, done: true });
      }

      const value = chunks[i];

      i++;

      return Promise.resolve({ value, done: false });
    }),
  };
}

function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function mockFetchResolvingTo(status: number, reader?: ReturnType<typeof makeReader>) {
  return jest.fn().mockResolvedValue({
    status,
    body: { getReader: () => reader },
  });
}

describe('streamJson', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sets default method and jsonl accept header when opt is omitted', async() => {
    const reader = makeReader([encode('{}')]);
    const fetchMock = mockFetchResolvingTo(200, reader);

    global.fetch = fetchMock as any;

    await streamJson('/some/url', undefined, jest.fn());

    expect(fetchMock).toHaveBeenCalledWith('/some/url', { method: 'get', headers: { accept: 'application/jsonl' } });
  });

  it('preserves a custom method and merges the jsonl accept header', async() => {
    const reader = makeReader([encode('{}')]);
    const fetchMock = mockFetchResolvingTo(200, reader);

    global.fetch = fetchMock as any;

    await streamJson('/some/url', { method: 'post', headers: { 'X-Custom': '1' } }, jest.fn());

    expect(fetchMock).toHaveBeenCalledWith('/some/url', {
      method:  'post',
      headers: { 'X-Custom': '1', accept: 'application/jsonl' },
    });
  });

  it('parses complete newline-delimited JSON lines split across chunks', async() => {
    const reader = makeReader([encode('{"a":1}\n{"a":2}\n'), encode('{"a":3}')]);

    global.fetch = mockFetchResolvingTo(200, reader) as any;

    const onData = jest.fn();

    await streamJson('/url', {}, onData);

    expect(onData.mock.calls.map((call) => call[0])).toStrictEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it('parses lines separated by carriage-return-newline pairs', async() => {
    const reader = makeReader([encode('{"a":1}\r\n{"a":2}\r\n{"a":3}')]);

    global.fetch = mockFetchResolvingTo(200, reader) as any;

    const onData = jest.fn();

    await streamJson('/url', {}, onData);

    expect(onData.mock.calls.map((call) => call[0])).toStrictEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it('parses the final buffered line once the stream reports done', async() => {
    const reader = makeReader([encode('{"a":1}\n{"a":2}')]);

    global.fetch = mockFetchResolvingTo(200, reader) as any;

    const onData = jest.fn();

    await streamJson('/url', {}, onData);

    expect(onData).toHaveBeenLastCalledWith({ a: 2 });
    expect(onData).toHaveBeenCalledTimes(2);
  });

  it('rejects with an error object including the response when status is 400 or above', async() => {
    const response = { status: 500 };
    const fetchMock = jest.fn().mockResolvedValue(response);

    global.fetch = fetchMock as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(streamJson('/url', {}, jest.fn())).rejects.toStrictEqual({
      message: 'Error Streaming',
      response,
    });
  });

  it('logs the error response to the console when status is 400 or above', async() => {
    const response = { status: 404 };

    global.fetch = jest.fn().mockResolvedValue(response) as any;

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await streamJson('/url', {}, jest.fn()).catch(() => {});

    expect(consoleError).toHaveBeenCalledWith('Error Streaming', response);
  });
});

describe('streamingSupported', () => {
  it('returns true when TextDecoder is defined', () => {
    expect(streamingSupported()).toStrictEqual(true);
  });
});
