import { SCC } from '@shell/store/features';

jest.doMock('@rancher/auto-import', () => ({ importTypes: jest.fn() }), { virtual: true });

describe('extension: rancher-prime telemetry', () => {
  const createPluginMock = (isPrime: boolean) => ({
    environment: { isPrime },
    addProduct:  jest.fn(),
    addRoutes:   jest.fn(),
    addPanel:    jest.fn(),
    addNavHooks: jest.fn(),
    register:    jest.fn(),
    metadata:    {},
  } as any);

  const getTelemetryFn = (pluginMock: any) => pluginMock.register.mock.calls.find(([type]: [string]) => type === 'telemetry');

  it('should register a telemetry function', async() => {
    const plugin = await import('./index');
    const pluginMock = createPluginMock(true);

    plugin.default(pluginMock);

    expect(pluginMock.register).toHaveBeenCalledWith('telemetry', 'prime', expect.any(Function));
  });

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('should return rp-scc based on the SCC feature flag (%s)', async(flag, expected) => {
    const plugin = await import('./index');
    const pluginMock = createPluginMock(true);

    plugin.default(pluginMock);

    const fn = getTelemetryFn(pluginMock)[2];
    const getters = { 'features/get': jest.fn().mockReturnValue(flag) };

    expect(fn(getters)).toStrictEqual({ 'rp-scc': expected });
    expect(getters['features/get']).toHaveBeenCalledWith(SCC);
  });
});
