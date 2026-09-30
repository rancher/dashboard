jest.mock('@rancher/auto-import', () => ({ importTypes: jest.fn() }), { virtual: true });
// The pages are only handed to the router here, so stand-ins do.
jest.mock('@pkg/configurable-views/pages/Home.vue', () => ({ name: 'ConfigurableHome' }));
jest.mock('@pkg/configurable-views/pages/ClusterDashboard.vue', () => ({ name: 'ConfigurableClusterDashboard' }));
jest.mock('@pkg/configurable-views/routing/index', () => ['product routes']);
jest.mock('@pkg/configurable-views/product', () => ({ init: jest.fn() }));

describe('extension: configurable-views', () => {
  async function initialize() {
    const { default: init } = await import('@pkg/configurable-views/index');
    const plugin = {
      addProduct:                 jest.fn(),
      addRoutes:                  jest.fn(),
      addRoute:                   jest.fn(),
      addNavHooks:                jest.fn(),
      addAction:                  jest.fn(),
      setHomePage:                jest.fn(),
      enableServerSidePagination: jest.fn(),
      metadata:                   {},
    };

    init(plugin as unknown as Parameters<typeof init>[0]);

    return plugin;
  }

  it('makes the Home configurable through the extension API', async() => {
    const plugin = await initialize();

    expect(plugin.setHomePage).toHaveBeenCalledWith({ name: 'ConfigurableHome' });
  });

  it("replaces a cluster's dashboard in place, under the layout it already lives in", async() => {
    const plugin = await initialize();

    expect(plugin.addRoute).toHaveBeenCalledWith('default', {
      name:      'c-cluster-explorer',
      path:      '/c/:cluster/explorer',
      component: { name: 'ConfigurableClusterDashboard' },
    });
  });

  it('adds its product, routes and navigation hook, and pages its tables on the server', async() => {
    const plugin = await initialize();

    expect(plugin.addProduct).toHaveBeenCalledTimes(1);
    expect(plugin.addRoutes).toHaveBeenCalledWith(['product routes']);
    expect(plugin.addNavHooks).toHaveBeenCalledWith({ onEnter: expect.any(Function) });
    expect(plugin.enableServerSidePagination).toHaveBeenCalledWith({ management: { resources: { enableSome: { enabled: expect.any(Array), generic: false } } } });
  });

  it('offers a header button, with a shortcut, on each configurable page that shows and hides the view bar', async() => {
    const plugin = await initialize();
    const { viewBarVisible } = await import('@pkg/configurable-views/composables/useViewBarVisibility');

    expect(plugin.addAction).toHaveBeenCalledTimes(2);
    expect(plugin.addAction.mock.calls.map(([where, when]) => [where, when])).toStrictEqual([
      ['header-action', { product: ['home'] }],
      ['header-action', { product: ['explorer'], path: [{ urlPath: '/explorer', endsWith: true }] }],
    ]);

    const action = plugin.addAction.mock.calls[0][2];

    expect(action.shortcut).toStrictEqual({ windows: ['ctrl', 'shift', 'v'], mac: ['meta', 'shift', 'v'] });

    const before = viewBarVisible.value;

    action.invoke();
    expect(viewBarVisible.value).toBe(!before);
    expect(action.ariaExpanded()).toBe(!before);
  });
});
