import axiosPlugin from '@shell/utils/axios';

describe('axios plugin', () => {
  const makeCtx = (config: Record<string, any> = {}) => ({ $config: config });

  const setup = (config?: Record<string, any>) => {
    const ctx: any = makeCtx(config);
    const inject = jest.fn();

    axiosPlugin(ctx, inject);

    return {
      ctx, inject, axios: ctx.$axios
    };
  };

  afterEach(() => {
    delete (process as any).browser;
    delete (window as any).$globalApp;
  });

  it('injects the created axios instance as $axios', () => {
    const { ctx, inject, axios } = setup();

    expect(ctx.$axios).toBe(axios);
    expect(inject).toHaveBeenCalledWith('axios', axios);
  });

  it('sets default headers scope objects independently of each other', () => {
    const { axios } = setup();

    axios.setHeader('X-Foo', 'bar', 'get');

    expect(axios.defaults.headers.get['X-Foo']).toStrictEqual('bar');
    expect(axios.defaults.headers.post['X-Foo']).toBeUndefined();
  });

  it.each([
    {
      desc:     'no runtime axios config, non-browser',
      browser:  false,
      config:   {},
      expected: 'https://localhost:8005/',
    },
    {
      desc:     'baseURL from runtime config, non-browser',
      browser:  false,
      config:   { axios: { baseURL: 'https://api.example.com' } },
      expected: 'https://api.example.com',
    },
    {
      desc:     'no runtime axios config, browser',
      browser:  true,
      config:   {},
      expected: '/',
    },
    {
      desc:     'browserBaseURL takes priority in the browser',
      browser:  true,
      config:   { axios: { browserBaseURL: 'https://browser.example.com', baseURL: 'https://server.example.com' } },
      expected: 'https://browser.example.com',
    },
    {
      desc:     'falls back to baseURL in the browser when browserBaseURL missing',
      browser:  true,
      config:   { axios: { baseURL: 'https://server.example.com' } },
      expected: 'https://server.example.com',
    },
  ])('computes baseURL for $desc', ({ browser, config, expected }) => {
    (process as any).browser = browser;

    const { axios } = setup(config);

    expect(axios.defaults.baseURL).toStrictEqual(expected);
  });

  describe('setBaseURL', () => {
    it('overrides the instance baseURL', () => {
      const { axios } = setup();

      axios.setBaseURL('https://new.example.com');

      expect(axios.defaults.baseURL).toStrictEqual('https://new.example.com');
    });
  });

  describe('setHeader', () => {
    it('sets the header value on the common scope by default', () => {
      const { axios } = setup();

      axios.setHeader('X-Custom', 'value');

      expect(axios.defaults.headers.common['X-Custom']).toStrictEqual('value');
    });

    it('sets the header value across multiple scopes when given an array', () => {
      const { axios } = setup();

      axios.setHeader('X-Custom', 'value', ['get', 'post']);

      expect(axios.defaults.headers.get['X-Custom']).toStrictEqual('value');
      expect(axios.defaults.headers.post['X-Custom']).toStrictEqual('value');
    });

    it('deletes the header from the scope when value is falsy', () => {
      const { axios } = setup();

      axios.setHeader('X-Custom', 'value');
      axios.setHeader('X-Custom', null);

      expect(axios.defaults.headers.common['X-Custom']).toBeUndefined();
    });
  });

  describe('setToken', () => {
    it('sets an Authorization header with a type prefix', () => {
      const { axios } = setup();

      axios.setToken('abc123', 'Bearer');

      expect(axios.defaults.headers.common.Authorization).toStrictEqual('Bearer abc123');
    });

    it('sets an Authorization header without a type prefix', () => {
      const { axios } = setup();

      axios.setToken('abc123');

      expect(axios.defaults.headers.common.Authorization).toStrictEqual('abc123');
    });

    it('clears the Authorization header when token is falsy', () => {
      const { axios } = setup();

      axios.setToken('abc123', 'Bearer');
      axios.setToken(null);

      expect(axios.defaults.headers.common.Authorization).toBeUndefined();
    });
  });

  describe('onRequest / onResponse / onRequestError / onResponseError / onError', () => {
    it('registers a request interceptor that can mutate the config', async() => {
      const { axios } = setup();
      const fn = jest.fn().mockReturnValue({ url: 'mutated' });

      axios.onRequest(fn);

      const handler = axios.interceptors.request.handlers[axios.interceptors.request.handlers.length - 1];
      const result = await handler.fulfilled({ url: 'original' });

      expect(fn).toHaveBeenCalledWith({ url: 'original' });
      expect(result).toStrictEqual({ url: 'mutated' });
    });

    it('falls back to the original config when the request handler returns falsy', async() => {
      const { axios } = setup();
      const fn = jest.fn().mockReturnValue(undefined);

      axios.onRequest(fn);

      const handler = axios.interceptors.request.handlers[axios.interceptors.request.handlers.length - 1];
      const result = await handler.fulfilled({ url: 'original' });

      expect(result).toStrictEqual({ url: 'original' });
    });

    it('registers a response interceptor that can mutate the response', async() => {
      const { axios } = setup();
      const fn = jest.fn().mockReturnValue({ data: 'mutated' });

      axios.onResponse(fn);

      const handler = axios.interceptors.response.handlers[axios.interceptors.response.handlers.length - 1];
      const result = await handler.fulfilled({ data: 'original' });

      expect(fn).toHaveBeenCalledWith({ data: 'original' });
      expect(result).toStrictEqual({ data: 'mutated' });
    });

    it('registers a request error interceptor that re-rejects by default', async() => {
      const { axios } = setup();
      const fn = jest.fn().mockReturnValue(undefined);
      const error = new Error('boom');

      axios.onRequestError(fn);

      const handler = axios.interceptors.request.handlers[axios.interceptors.request.handlers.length - 1];

      await expect(handler.rejected(error)).rejects.toStrictEqual(error);
      expect(fn).toHaveBeenCalledWith(error);
    });

    it('registers a response error interceptor that re-rejects by default', async() => {
      const { axios } = setup();
      const fn = jest.fn().mockReturnValue(undefined);
      const error = new Error('boom');

      axios.onResponseError(fn);

      const handler = axios.interceptors.response.handlers[axios.interceptors.response.handlers.length - 1];

      await expect(handler.rejected(error)).rejects.toStrictEqual(error);
      expect(fn).toHaveBeenCalledWith(error);
    });

    it('onError registers both a request and a response error interceptor', () => {
      const { axios } = setup();
      const requestHandlerCountBefore = axios.interceptors.request.handlers.length;
      const responseHandlerCountBefore = axios.interceptors.response.handlers.length;
      const fn = jest.fn();

      axios.onError(fn);

      expect(axios.interceptors.request.handlers.length).toStrictEqual(requestHandlerCountBefore + 1);
      expect(axios.interceptors.response.handlers.length).toStrictEqual(responseHandlerCountBefore + 1);
    });
  });

  describe('$ request helpers', () => {
    it.each([
      { desc: '$get', method: 'get' },
      { desc: '$post', method: 'post' },
      { desc: '$put', method: 'put' },
      { desc: '$patch', method: 'patch' },
      { desc: '$delete', method: 'delete' },
      { desc: '$head', method: 'head' },
      { desc: '$options', method: 'options' },
    ])('$desc resolves to response.data', async({ method }) => {
      const { axios } = setup();
      const response = { data: { hello: 'world' } };

      jest.spyOn(axios, method as any).mockResolvedValue(response);

      const result = await axios[`$${ method }`]('/some/url');

      expect(axios[method]).toHaveBeenCalledWith('/some/url');
      expect(result).toStrictEqual({ hello: 'world' });
    });

    it('$request resolves to response.data and forwards its arguments', async() => {
      const { axios } = setup();
      const response = { data: { ok: true } };
      const config = { url: '/some/url', method: 'get' };

      jest.spyOn(axios, 'request').mockResolvedValue(response);

      const result = await axios.$request(config);

      expect(axios.request).toHaveBeenCalledWith(config);
      expect(result).toStrictEqual({ ok: true });
    });

    it('resolves to undefined when the underlying response is falsy', async() => {
      const { axios } = setup();

      jest.spyOn(axios, 'get').mockResolvedValue(undefined);

      const result = await axios.$get('/some/url');

      expect(result).toBeUndefined();
    });
  });

  describe('setupProgress ($loading integration)', () => {
    const makeLoading = () => ({
      finish: jest.fn(),
      start:  jest.fn(),
      fail:   jest.fn(),
      set:    jest.fn(),
    });

    const getHandlers = (axios: any) => ({
      request:       axios.interceptors.request.handlers[0],
      response:      axios.interceptors.response.handlers[0],
      responseError: axios.interceptors.response.handlers[1],
    });

    it('calls $loading.finish() once the last in-flight request settles', async() => {
      const loading = makeLoading();

      (window as any).$globalApp = { $loading: loading };

      const { axios } = setup();
      const { request, response } = getHandlers(axios);

      await request.fulfilled({});
      expect(loading.finish).not.toHaveBeenCalledWith();

      await response.fulfilled({ config: {} });
      expect(loading.finish).toHaveBeenCalledWith();
    });

    it('does not track progress when config.progress is false', async() => {
      const loading = makeLoading();

      (window as any).$globalApp = { $loading: loading };

      const { axios } = setup();
      const { request, response } = getHandlers(axios);

      await request.fulfilled({ progress: false });
      await response.fulfilled({ config: { progress: false } });

      expect(loading.finish).not.toHaveBeenCalledWith();
    });

    it('calls $loading.fail() and finish() on a non-cancel error', async() => {
      const loading = makeLoading();

      (window as any).$globalApp = { $loading: loading };

      const { axios } = setup();
      const { request, responseError } = getHandlers(axios);

      await request.fulfilled({});

      const error = { config: {}, message: 'network error' };

      await expect(responseError.rejected(error)).rejects.toStrictEqual(error);

      expect(loading.fail).toHaveBeenCalledWith();
      expect(loading.finish).toHaveBeenCalledWith();
    });

    it('does not call $loading.fail() for a cancelled request', async() => {
      const loading = makeLoading();

      (window as any).$globalApp = { $loading: loading };

      const { axios } = setup();
      const { request, responseError } = getHandlers(axios);

      await request.fulfilled({});

      const cancelError = new (require('axios').Cancel)('cancelled');

      await expect(responseError.rejected(cancelError)).rejects.toStrictEqual(cancelError);

      expect(loading.fail).not.toHaveBeenCalledWith();
    });

    it('falls back to a noop loading interface when $globalApp is not ready', async() => {
      const { axios } = setup();
      const { request, response } = getHandlers(axios);

      await request.fulfilled({});

      const result = response.fulfilled({ config: {} });

      expect(result).toStrictEqual({ config: {} });
    });
  });
});
