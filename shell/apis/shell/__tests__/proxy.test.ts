// proxy.test.ts

import {
  describe, it, expect, jest, beforeEach
} from '@jest/globals';
import { ProxyApiImpl, createDepaginator } from '../proxy';
import { Store } from 'vuex';

const PROXY_PREFIX = '/meta/proxy/';

describe('proxyApiImpl', () => {
  let mockStore: Store<any>;
  let mockDispatch: jest.Mock;
  let proxyApi: ProxyApiImpl;

  beforeEach(() => {
    mockDispatch = jest.fn() as any;
    mockStore = { dispatch: mockDispatch } as any;
    proxyApi = new ProxyApiImpl(mockStore);
  });

  // ---------------------------------------------------------------------------
  // prepareRequest — URL building
  // ---------------------------------------------------------------------------

  describe('prepareRequest: URL building', () => {
    it('should prepend /meta/proxy/ to a url, stripping the https scheme', () => {
      const { url } = proxyApi.prepareRequest({ url: new URL('https://api.example.com/v1/things') });

      expect(url).toBe(`${ PROXY_PREFIX }api.example.com/v1/things`);
    });

    it('should preserve http:/ (one slash) for plain-HTTP urls', () => {
      const { url } = proxyApi.prepareRequest({ url: new URL('http://api.example.com:1234/v1/things') });

      expect(url).toBe(`${ PROXY_PREFIX }http:/api.example.com:1234/v1/things`);
    });

    it('should preserve query params', () => {
      const input = new URL('https://api.example.com/v1/things');

      input.searchParams.set('region', 'us-east-1');
      input.searchParams.set('page', '2');

      const { url } = proxyApi.prepareRequest({ url: input });

      expect(url).toBe(`${ PROXY_PREFIX }api.example.com/v1/things?region=us-east-1&page=2`);
    });
  });

  // ---------------------------------------------------------------------------
  // prepareRequest — header building
  // ---------------------------------------------------------------------------

  describe('prepareRequest: header building', () => {
    it('should set Accept to application/json by default', () => {
      const { headers } = proxyApi.prepareRequest({ url: new URL('https://api.example.com') });

      expect(headers['Accept']).toBe('application/json');
    });

    it('should override Accept when accept option is provided', () => {
      const { headers } = proxyApi.prepareRequest({ url: new URL('https://api.example.com'), accept: 'text/plain' });

      expect(headers['Accept']).toBe('text/plain');
    });

    it('should merge caller-supplied headers', () => {
      const { headers } = proxyApi.prepareRequest({
        url:     new URL('https://api.example.com'),
        headers: { 'X-Custom': 'value' },
      });

      expect(headers['X-Custom']).toBe('value');
    });

    it('should set x-api-auth-header with Bearer scheme for a token by default', () => {
      const { headers } = proxyApi.prepareRequest({
        url:            new URL('https://api.example.com'),
        authentication: { token: 'my-token' },
      });

      expect(headers['x-api-auth-header']).toBe('Bearer my-token');
    });

    it('should use the supplied authSigner as the scheme for a token', () => {
      const { headers } = proxyApi.prepareRequest({
        url:            new URL('https://api.example.com'),
        authentication: { token: 'encoded==', authSigner: 'basic' },
      });

      expect(headers['x-api-auth-header']).toBe('basic encoded==');
    });

    it('should set x-api-cattleauth-header with signer and credID', () => {
      const { headers } = proxyApi.prepareRequest({
        url:            new URL('https://api.example.com'),
        authentication: {
          id:            'cattle-global-data:my-cred',
          authSigner:    'bearer',
          passwordField: 'token',
        },
      });

      expect(headers['x-api-cattleauth-header']).toContain('bearer ');
      expect(headers['x-api-cattleauth-header']).toContain('credID=cattle-global-data:my-cred');
      expect(headers['x-api-cattleauth-header']).toContain('passwordField=token');
    });

    it('should include usernameField in x-api-cattleauth-header when provided', () => {
      const { headers } = proxyApi.prepareRequest({
        url:            new URL('https://api.example.com'),
        authentication: {
          id:            'cattle-global-data:my-cred',
          authSigner:    'basic',
          usernameField: 'username',
          passwordField: 'password',
        },
      });

      expect(headers['x-api-cattleauth-header']).toContain('usernameField=username');
      expect(headers['x-api-cattleauth-header']).toContain('passwordField=password');
    });

    it('should not set x-api-cattleauth-header when no authentication is provided', () => {
      const { headers } = proxyApi.prepareRequest({ url: new URL('https://api.example.com') });

      expect(headers['x-api-cattleauth-header']).toBeUndefined();
    });

    it('should not set x-api-auth-header when no authentication is provided', () => {
      const { headers } = proxyApi.prepareRequest({ url: new URL('https://api.example.com') });

      expect(headers['x-api-auth-header']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // request
  // ---------------------------------------------------------------------------

  describe('request', () => {
    it('should dispatch management/request with the built url and headers', async() => {
      mockDispatch.mockResolvedValue({ data: [] });

      await proxyApi.request({ url: new URL('https://api.example.com/v1/items') });

      expect(mockDispatch).toHaveBeenCalledWith(
        'management/request',
        expect.objectContaining({
          url:                  `${ PROXY_PREFIX }api.example.com/v1/items`,
          redirectUnauthorized: false,
        }),
        { root: true }
      );
    });

    it('should pass method through to management/request', async() => {
      mockDispatch.mockResolvedValue({});

      await proxyApi.request({ url: new URL('https://api.example.com/token'), method: 'POST' });

      expect(mockDispatch).toHaveBeenCalledWith(
        'management/request',
        expect.objectContaining({ method: 'POST' }),
        { root: true }
      );
    });

    it('should return the response directly when no postProcess is set', async() => {
      const mockResponse = { items: ['a', 'b'] };

      mockDispatch.mockResolvedValue(mockResponse);

      const result = await proxyApi.request({ url: new URL('https://api.example.com/items') });

      expect(result).toStrictEqual(mockResponse);
    });

    it('should call postProcess with the response and return its result', async() => {
      const raw = { items: ['a'] };
      const processed = { items: ['a', 'b'] };

      mockDispatch.mockResolvedValue(raw);
      const postProcess = jest.fn().mockResolvedValue(processed) as jest.Mock;

      const result = await proxyApi.request({ url: new URL('https://api.example.com/items'), postProcess });

      expect(postProcess).toHaveBeenCalledWith(raw);
      expect(result).toStrictEqual(processed);
    });

    it('createDepaginator: should follow next links and merge results', async() => {
      const page1 = {
        items: ['a', 'b'],
        links: { pages: { next: 'https://api.example.com/v1/items?page=2' } },
      };
      const page2 = {
        items: ['c'],
        links: { pages: { next: null } },
      };

      mockDispatch
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const baseOptions = { url: new URL('https://api.example.com/v1/items') };
      const result = await proxyApi.request({
        ...baseOptions,
        postProcess: createDepaginator(proxyApi, baseOptions, { mergeKey: 'items' }),
      });

      expect(result.items).toStrictEqual(['a', 'b', 'c']);
      expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('createDepaginator: should use a custom nextUrlPath when provided', async() => {
      const page1 = {
        data:   ['x'],
        paging: { next: 'https://api.example.com/v1/things?cursor=abc' },
      };
      const page2 = {
        data:   ['y'],
        paging: { next: null },
      };

      mockDispatch
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const baseOptions = { url: new URL('https://api.example.com/v1/things') };
      const result = await proxyApi.request({
        ...baseOptions,
        postProcess: createDepaginator(proxyApi, baseOptions, {
          nextUrlPath: 'paging.next',
          mergeKey:    'data',
        }),
      });

      expect(result.data).toStrictEqual(['x', 'y']);
    });
  });

  // ---------------------------------------------------------------------------
  // allowDomains
  // ---------------------------------------------------------------------------

  describe('allowDomains', () => {
    it('should dispatch management/create with the correct type and routes', async() => {
      const mockSave = jest.fn().mockResolvedValue({ spec: { routes: [] } });

      mockDispatch.mockResolvedValue({ save: mockSave });

      await proxyApi.allowDomains(['api.example.com', '%.amazonaws.com'], 'my-cr');

      expect(mockDispatch).toHaveBeenCalledWith('management/create', {
        type:     'management.cattle.io.proxyEndpoint',
        metadata: { name: 'my-cr' },
        spec:     {
          routes: [
            { domain: 'api.example.com' },
            { domain: '%.amazonaws.com' },
          ],
        },
      });

      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should use an generateName when none is supplied', async() => {
      const mockSave = jest.fn().mockResolvedValue({});

      mockDispatch.mockResolvedValue({ save: mockSave });

      await proxyApi.allowDomains(['api.example.com']);

      expect(mockDispatch).toHaveBeenCalledWith('management/create', expect.objectContaining({
        metadata: { generateName: 'endpoints-' }, spec: { routes: [{ domain: 'api.example.com' }] }, type: 'management.cattle.io.proxyEndpoint'
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // isDomainAllowed
  // ---------------------------------------------------------------------------

  describe('isDomainAllowed', () => {
    it('should return true when the domain is found in a ProxyEndpoint CR', async() => {
      mockDispatch.mockResolvedValue([
        { spec: { routes: [{ domain: 'api.example.com' }, { domain: 'other.example.com' }] } },
      ]);

      const result = await proxyApi.isDomainAllowed('api.example.com');

      expect(result).toBe(true);
    });

    it('should match case-insensitively', async() => {
      mockDispatch.mockResolvedValue([
        { spec: { routes: [{ domain: 'API.EXAMPLE.COM' }] } },
      ]);

      const result = await proxyApi.isDomainAllowed('api.example.com');

      expect(result).toBe(true);
    });

    it('should return false when the domain is not found in any CR', async() => {
      mockDispatch.mockResolvedValue([
        { spec: { routes: [{ domain: 'other.example.com' }] } },
      ]);

      const result = await proxyApi.isDomainAllowed('api.example.com');

      expect(result).toBe(false);
    });

    it('should return false when there are no ProxyEndpoint CRs', async() => {
      mockDispatch.mockResolvedValue([]);

      const result = await proxyApi.isDomainAllowed('api.example.com');

      expect(result).toBe(false);
    });

    it('should return false when a CR has no routes', async() => {
      mockDispatch.mockResolvedValue([{ spec: {} }]);

      const result = await proxyApi.isDomainAllowed('api.example.com');

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // hasProxyEndpoint
  // ---------------------------------------------------------------------------

  describe('hasProxyEndpoint', () => {
    it('should return true when management/find resolves', async() => {
      mockDispatch.mockResolvedValue({ metadata: { name: 'my-cr' } });

      const result = await proxyApi.hasProxyEndpoint('my-cr');

      expect(result).toBe(true);
      expect(mockDispatch).toHaveBeenCalledWith('management/find', {
        type: 'management.cattle.io.proxyEndpoint',
        id:   'my-cr',
        opt:  { force: false },
      });
    });

    it('should return false when management/find rejects with status 404', async() => {
      mockDispatch.mockRejectedValue({ status: 404 });

      const result = await proxyApi.hasProxyEndpoint('missing-cr');

      expect(result).toBe(false);
    });

    it('should re-throw errors that are not 404', async() => {
      const serverError = { status: 500, message: 'Internal Server Error' };

      mockDispatch.mockRejectedValue(serverError);

      await expect(proxyApi.hasProxyEndpoint('my-cr')).rejects.toStrictEqual(serverError);
    });
  });
});
