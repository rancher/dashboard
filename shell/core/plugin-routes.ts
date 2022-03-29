import Router, { RouteConfig } from 'vue-router';

interface RouteInfo {
  parentOrRoute: string | RouteConfig;
  route?: RouteConfig;
}

export class PluginRoutes {
  router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  public logRoutes(r: any, indent = 0) {
    const spaces = Array(indent).join(' ');

    r.forEach((s: any) => {
      console.log(`${ spaces }${ s.name } -> ${ s.path }`); // eslint-disable-line no-console
      this.logRoutes(s.children || [], indent + 2);
    });
  }

  public addRoutes(plugin: any, routes: RouteInfo[]) {
    const appRoutes = this.router.options.routes || [];
    let replaced = 0;

    // Need to take into account if routes are being replaced
    // Despite what the docs say, routes are not replaced, so we use a workaround
    // Remove all routes that are being replaced
    routes.forEach((r: RouteInfo) => {
      // See if the route exists
      let existing;

      if (r.route) {
        // parentOrRoute is the name of the parent route
        const pExisting = appRoutes.findIndex((route: any) => route.name === r.parentOrRoute) as any;
        const path = `${ pExisting.path }${ r.route.path }`;

        // TODO: Validate
        existing = appRoutes.findIndex((route: any) => route.path === path);
      } else {
        // no parent route
        const theRoute = r.parentOrRoute as RouteConfig;

        existing = appRoutes.findIndex((route: any) => route.name === theRoute.name);
      }

      if (existing) {
        appRoutes.splice(existing, 1);
        replaced++;
      }
    });

    let newRouter = this.router;

    if (replaced > 0) {
      newRouter = new Router({
        mode:   'history',
        routes: appRoutes
      }) as any;
    }

    routes.forEach((r: any) => {
      newRouter.addRoute(r.parentOrRoute, r.route);
    });

    if (replaced > 0) {
      (this.router as any).matcher = (newRouter as any).matcher;
    }

    // If we replaced any routes, then we should reload on uninstall
    plugin.reloadOnUninstall = replaced > 0;
  }
}
