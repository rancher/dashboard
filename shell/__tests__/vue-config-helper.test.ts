import { toViteProxy } from '@shell/vue-config-helper';

describe('fx: toViteProxy', () => {
  const matches = (path: string, url: string) => new RegExp(Object.keys(toViteProxy({ [path]: { target: 'https://rancher' } }))[0]).test(url);

  it.each([
    ['/v1', '/v1', true],
    ['/v1', '/v1/management.cattle.io.settings', true],
    ['/v1', '/v1?watch=true', true],
    ['/v1', '/v1-public/authproviders', false],
    ['/api', '/api-ui/ui.min.js', false],
    ['/v3', '/v3-public/authProviders', false],
    ['/v1-*', '/v1-public/authproviders', true],
    ['/v1-*', '/v1/management.cattle.io.settings', false],
    ['/k8s', '/k8s/clusters/local/v1/pods', true],
    ['/k8s', '/k8sfoo', false],
  ])('should proxy "%s" for %s: %p', (path, url, expected) => {
    expect(matches(path, url)).toStrictEqual(expected);
  });

  it('should keep the proxy options other than the event handlers', () => {
    const [options]: any[] = Object.values(toViteProxy({
      '/v3': {
        target: 'https://rancher', ws: true, changeOrigin: true, onProxyReq: jest.fn()
      }
    }));
    const { configure, ...rest } = options;

    expect(rest).toStrictEqual({
      target: 'https://rancher', ws: true, changeOrigin: true
    });
  });

  it('should add the event handlers to the proxy', () => {
    const handlers = {
      onProxyReq: jest.fn(), onProxyReqWs: jest.fn(), onProxyRes: jest.fn(), onError: jest.fn()
    };
    const [options]: any[] = Object.values(toViteProxy({ '/v3': { target: 'https://rancher', ...handlers } }));
    const proxy = { on: jest.fn() };

    options.configure(proxy, {});

    expect(proxy.on).toHaveBeenCalledWith('proxyReq', handlers.onProxyReq);
    expect(proxy.on).toHaveBeenCalledWith('proxyReqWs', handlers.onProxyReqWs);
    expect(proxy.on).toHaveBeenCalledWith('proxyRes', handlers.onProxyRes);
    expect(proxy.on).toHaveBeenCalledWith('error', handlers.onError);
  });

  it('should call a configure function of its own', () => {
    const configure = jest.fn();
    const [options]: any[] = Object.values(toViteProxy({ '/v3': { target: 'https://rancher', configure } }));
    const proxy = { on: jest.fn() };
    const proxyOptions = { target: 'https://rancher' };

    options.configure(proxy, proxyOptions);

    expect(configure).toHaveBeenCalledWith(proxy, proxyOptions);
  });
});
