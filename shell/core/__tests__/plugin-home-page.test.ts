import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import { Plugin } from '@shell/core/plugin';
import { PluginRoutes } from '@shell/core/plugin-routes';
import routes from '@shell/config/router/routes';
import { HOME_LAYOUT } from '@shell/config/router/route-names';

const HomeLayout = { template: '<router-view />' };
const StockHome = { template: '<div>stock home</div>' };
const ExtensionHome = { template: '<div>extension home</div>' };

describe('plugin.setHomePage', () => {
  it('adds the home page as a child of the home layout', () => {
    const plugin = new Plugin('test-extension');

    plugin.setHomePage(ExtensionHome);

    expect(plugin.routes).toHaveLength(1);
    expect(plugin.routes[0].parent).toBe(HOME_LAYOUT);
    expect(plugin.routes[0].route).toStrictEqual(expect.objectContaining({
      name: 'home', path: '/home', component: ExtensionHome, meta: { pkg: 'test-extension' }
    }));
  });

  it('replaces the stock home page, keeping the home layout and its meta', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes:  [{
        path:      '/',
        name:      HOME_LAYOUT,
        component: HomeLayout,
        meta:      { requiresAuthentication: true },
        children:  [{
          path: '/home', name: 'home', component: StockHome
        }],
      }],
    });
    const plugin = new Plugin('test-extension');

    plugin.setHomePage(ExtensionHome);
    // What the extension manager does with a plugin's routes once it has loaded.
    new PluginRoutes(router).addRoutes(plugin.routes.map(({ parent, route }) => ({ parent, route: route as RouteRecordRaw })));

    const matched = router.resolve({ name: 'home' }).matched;

    expect(matched.map((r) => r.name)).toStrictEqual([HOME_LAYOUT, 'home']);
    expect(matched[1].components?.default).toBe(ExtensionHome);
    expect(matched[0].meta.requiresAuthentication).toBe(true);
  });
});

describe('the home layout route', () => {
  it('is named, so the home page can be added under it', () => {
    const layout = routes.find((r) => r.name === HOME_LAYOUT);

    expect(layout?.children?.map((r) => r.name)).toContain('home');
  });
});
