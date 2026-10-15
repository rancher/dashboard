import Licenses from '@shell/pages/licenses.vue';

type FetchContext = {
  loading: boolean;
  notFound: boolean;
  errorStatus: string | number | null;
  data: any;
};

const mockResponse = ({ status = 200, contentType = 'application/json', body = {} }: { status?: number; contentType?: string | null; body?: any } = {}) => ({
  status,
  ok:      status >= 200 && status < 300,
  headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
  json:    jest.fn().mockResolvedValue(body)
});

const runFetch = async(response: any): Promise<FetchContext> => {
  const thisContext: FetchContext = {
    loading: false, notFound: false, errorStatus: null, data: null
  };

  global.fetch = jest.fn().mockResolvedValue(response);

  await (Licenses.fetch as () => Promise<void>).call(thisContext);

  return thisContext;
};

describe('page: Licenses', () => {
  describe('fetch', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('stores the parsed licenses when the response is json', async() => {
      const body = { packages: [], licenses: {} };

      const result = await runFetch(mockResponse({ body }));

      expect(result.data).toStrictEqual(body);
    });

    it('does not flag a json response as not found', async() => {
      const result = await runFetch(mockResponse());

      expect(result.notFound).toBe(false);
    });

    it('treats a 404 as not found', async() => {
      const result = await runFetch(mockResponse({ status: 404, contentType: 'text/plain' }));

      expect(result.notFound).toBe(true);
    });

    it.each([
      'text/html',
      'text/html; charset=utf-8',
    ])('treats a 200 with content type "%s" as not found', async(contentType) => {
      const result = await runFetch(mockResponse({ contentType }));

      expect(result.notFound).toBe(true);
    });

    it('does not parse the body of an html response', async() => {
      const response = mockResponse({ contentType: 'text/html' });

      const result = await runFetch(response);

      expect(response.json).not.toHaveBeenCalled();
      expect(result.data).toBeNull();
    });

    it('parses the body when no content type is returned', async() => {
      const body = { packages: [], licenses: {} };

      const result = await runFetch(mockResponse({ contentType: null, body }));

      expect(result.data).toStrictEqual(body);
    });

    it('reports the status for other error responses', async() => {
      const result = await runFetch(mockResponse({ status: 500, contentType: 'text/html' }));

      expect(result.errorStatus).toBe(500);
    });

    it('does not flag an html error response as not found', async() => {
      const result = await runFetch(mockResponse({ status: 500, contentType: 'text/html' }));

      expect(result.notFound).toBe(false);
    });

    it('clears loading once the request completes', async() => {
      const result = await runFetch(mockResponse());

      expect(result.loading).toBe(false);
    });
  });
});
