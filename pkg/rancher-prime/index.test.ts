import { SCC } from '@shell/store/features';
const { IF_HAVE } = require('@shell/store/type-map');
const mockAutoImport = jest.fn();

jest.doMock('@rancher/auto-import', () => ({ importTypes: mockAutoImport }), { virtual: true });

describe('extension: rancher-prime', () => {
  it('should enable routing for admin users with SCC feature', async() => {
    // Dynamically import the plugin after the mock is set up
    const plugin = await import('./index');

    const virtualTypeSpy = jest.fn();
    const basicTypeSpy = jest.fn();
    const dslMock = jest.fn().mockReturnValue({
      virtualType: virtualTypeSpy,
      basicType:   basicTypeSpy
    });

    const pluginMock = {
      environment: { isPrime: true },
      addProduct:  jest.fn(),
      addRoutes:   jest.fn(),
      addPanel:    jest.fn(),
      addNavHooks: jest.fn(),
      metadata:    {},
      DSL:         dslMock
    } as any;

    plugin.default(pluginMock); // basic extension import
    pluginMock.addProduct.mock.calls[0][0].init(pluginMock, {}); // force init to trigger as in @rancher/shell

    expect(pluginMock.addProduct).toHaveBeenCalledWith(
      expect.objectContaining({ init: expect.any(Function) })
    );
    expect(virtualTypeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ifHave:    IF_HAVE.ADMIN,
        ifFeature: SCC
      })
    );
  });
});
