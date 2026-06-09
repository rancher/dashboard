import { Plugin } from '@shell/core/plugin';

describe('plugin', () => {
  const route = { name: 'test', path: '/test' };
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('does not warn for built-in plugins when parent is omitted', () => {
    const plugin = new Plugin('test');

    plugin.builtin = true;
    plugin.addRoute(route as any);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(plugin.routes[0].parent).toBe('default');
  });

  it('warns for non built-in plugins when parent is omitted', () => {
    const plugin = new Plugin('test');

    plugin.addRoute(route as any);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(plugin.routes[0].parent).toBe('default');
  });
});
