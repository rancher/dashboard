import Router, { RouteConfig } from 'vue-router';

interface RouteInfo {
  parent?: string;
  route: RouteConfig;
}

interface RouteInstallInfo {
  plugin: string;
  route: RouteConfig;
}

type RouteInstallHistory = {
  [route: string]: RouteInstallInfo[]
}

export class PluginRoutes {
  router: Router;
  pluginRoutes: RouteConfig[] = [];

  replacedRoutes: RouteInstallHistory = {};

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

  // Ensure we put back any routes that the plugin that is being uninstalled added
  public uninstall(plugin: any) {
    // List of routes we need to restore
    const restore: RouteInfo[] = [];

    Object.keys(this.replacedRoutes).forEach((routeName) => {
      const info = this.replacedRoutes[routeName];

      for (let index = 0; index < info.length; index++) {
        const savedRoute = info[index];

        if (savedRoute.plugin === plugin.id) {
          // The plugin that is being uninstalled replaced an existing route that we will restore
          if (index === 0) {
            // Need to restore the previous route, since the plugin owned the active route
            info.shift();

            restore.push({ route: savedRoute.route });

            break;
          } else {
            // Need to update the previous item so that when it is removed, it restores the correct route
            const previous = info[index - 1];

            previous.route = savedRoute.route;
            info.splice(index, 1);

            break;
          }
        }
      }
    });

    // Remove routes from pluginRoutes, update matcher (to avoid dupes when re-adding plugin routes)
    this.pluginRoutes = this.pluginRoutes.filter(pR => !plugin.routes.find((r: any) => pR === r.route));
    this.updateMatcher([], [
      ...this.pluginRoutes,
      ...(this.router.options.routes || [])
    ]);

    // Restore appropriate routes
    if (restore.length > 0) {
      this.addRoutes(null, restore);
    }
  }

  public addRoutes(plugin: any, routes: RouteInfo[]) {
    const allRoutes = [
      ...this.pluginRoutes,
      ...(this.router.options.routes || [])
    ];

    // Need to take into account if routes are being replaced
    // Despite what the docs say, routes are not replaced, so we use a workaround
    // Remove all routes that are being replaced
    routes.forEach((r: RouteInfo) => {
      // See if the route exists
      let existing: any;

      if (r.parent) {
        const pExisting = allRoutes.findIndex((route: any) => route.name === r.parent) as any;
        const path = `${ pExisting.path }${ r.route.path }`;

        // TODO: Validate
        existing = allRoutes.findIndex((route: any) => route.path === path);
      } else {
        // no parent route
        existing = allRoutes.findIndex((route: any) => route.name === r.route.name);
      }

      if (existing >= 0) {
        const existingRoute = allRoutes[existing];

        // Store the route so we can restore it on uninstall
        if (plugin && existingRoute?.name) {
          if (!this.replacedRoutes[existingRoute.name]) {
            this.replacedRoutes[existingRoute.name] = [];
          }

          this.replacedRoutes[existingRoute.name].unshift({
            plugin: plugin.id,
            route:  existingRoute
          });
        }

        allRoutes.splice(existing, 1);
      }
    });

    this.updateMatcher(routes, allRoutes);
  }

  private updateMatcher(newRoutes: RouteInfo[], allRoutes: RouteConfig[]) {
    // Note - Always use a new router and replace the existing router's matching
    // Using the existing router and adding routes to it will force nuxt middleware (specifically authenticated on default layout) to
    // execute many times (nuxt middleware boils down to router.beforeEach). This issue was seen refreshing in a harvester cluster with a
    // dynamically loaded cluster
    const newRouter: Router = new Router({
      mode:   'history',
      routes: allRoutes
    });

    newRoutes.forEach((r: any) => {
      if (r.parent) {
        newRouter.addRoute(r.parent, r.route);
      } else {
        newRouter.addRoute(r.route);
      }
      this.pluginRoutes.push(r.route);
    });

    // Typing is incorrect
    (this.router as any).matcher = (newRouter as any).matcher;
  }
}
