/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Router, { RouteConfig } from 'vue-router';

interface RouteInfo {
  parent?: string;
  route: RouteConfig;
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

  public addRoutes(plugin: any, newRouteInfos: RouteInfo[]) {
    const allRoutes = [
      ...(this.router.options.routes || [])
    ];

    // Need to take into account if routes are being replaced
    // Despite what the docs say, routes are not replaced, so we use a workaround
    // Remove all routes that are being replaced
    const newRoutes = newRouteInfos.map((ri) => ri.route);

    this.forEachNestedRoutes(newRoutes, (r: RouteConfig) => {
      // Patch colliding legacy routes that start /:product
      if (r.path?.startsWith('/:product')) {
        // Legacy pattern used by extensions - routes may collide, so modify them not to
        let productName;

        // If the route has a name (which is always the case for the extensions we have written), use it to get the product name
        if (r.name) {
          const nameParts = r.name.split('-');

          // First part of the route name is the product name
          productName = nameParts[0];
        }

        // Use the plugin name as the product, if the route does not have a name
        productName = productName || plugin.name;

        // Replace the path - removing :product and using the actual product name instead - this avoids route collisions
        r.path = `/${ productName }${ r.path.substr(9) }`;
        r.meta = r.meta || {};

        r.meta.product = r.meta.product || productName;
      }
    });

    this.updateMatcher(newRouteInfos, allRoutes);
  }

  private updateMatcher(newRoutes: RouteInfo[], allRoutes: RouteConfig[]) {
    // Note - Always use a new router and replace the existing router's matching
    // Using the existing router and adding routes to it will force nuxt middleware to
    // execute many times (nuxt middleware boils down to router.beforeEach). This issue was seen refreshing in a harvester cluster with a
    // dynamically loaded cluster

    const orderedPluginRoutes: any[] = [];

    // separate plugin routes that have parent and not, you want to push the new routes in REVERSE order to the front of the existing list so that the order of routes specified by the extension is preserved
    newRoutes.reverse().forEach((r: any) => {
      let foundParentRoute;

      if (r.parent) {
        foundParentRoute = this.findInNestedRoutes(allRoutes, (route: RouteConfig) => route.name === r.parent);

        if (foundParentRoute) {
          foundParentRoute.children = foundParentRoute?.children || [];
          foundParentRoute.children.unshift(r.route);
        }
      }

      if (!foundParentRoute) {
        orderedPluginRoutes.unshift(r.route);
      }
    });

    const newRouter: Router = new Router({
      mode:   'history',
      routes: [...orderedPluginRoutes, ...allRoutes]
    });

    (this.router as any).matcher = (newRouter as any).matcher;
  }

  /**
   * Traverse the entire tree of nested routes
   *
   * @param routes The routes we wish to traverse through
   * @param fn -> Return true if you'd like to break the loop early (small)
   * @returns {@boolean} -> Returns true if breaking early
   */
  private forEachNestedRoutes(routes: RouteConfig[] = [], fn: (route: RouteConfig) => boolean | undefined | void) {
    for (let i = 0; i < routes.length; ++i) {
      const route = routes[i];
      const result = fn(route);

      if (result || this.forEachNestedRoutes(route.children, fn)) {
        return true;
      }
    }
  }

  /**
   * Find a route that matches the criteria defined by fn.
   *
   * @param routes The routes we wish to search through
   * @param fn -> Returns true if the passed in route matches the expected criteria
   * @returns The found route or undefined
   */
  private findInNestedRoutes(routes: RouteConfig[] = [], fn: (route: RouteConfig) => boolean): RouteConfig | undefined {
    let found: any;

    this.forEachNestedRoutes(routes, (route) => {
      if (fn(route)) {
        found = route;

        return true;
      }
    });

    return found;
  }
}
