import * as plugin from './index';

describe('extension: rancher-prime', () => {
  it('should enable routing for admin users', () => {
    const navigationSpy = jest.fn();
    const pluginMock = {
      environment: { isPrime: true },
      addProduct:  navigationSpy,
      addRoutes:   jest.fn(),
      addPanel:    jest.fn(),
      addNavHooks: jest.fn(),
      metadata:    {}
    } as any;

    plugin.default(pluginMock);

    expect(pluginMock.addProduct).toHaveBeenCalledWith(navigationSpy);
    expect(navigationSpy).toHaveBeenCalledWith(navigationSpy);
  });
});
