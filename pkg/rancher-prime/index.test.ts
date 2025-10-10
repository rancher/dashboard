import * as plugin from 'index';

describe('extension: rancher-prime', () => {
  it('should load only for admin users', () => {
    const pluginSpy = {
      environment: { isPrime: true },
      addProduct:  jest.fn(),
      addRoutes:   jest.fn(),
      addPanel:    jest.fn(),
      addNavHooks: jest.fn(),
      metadata:    {}
    } as any;

    plugin.default(pluginSpy);

    // eslint-disable-next-line jest/prefer-called-with
    expect(pluginSpy.addNavHooks).toHaveBeenCalled();
  });
});
