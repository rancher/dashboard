import { RouteRecordRaw, Router } from 'vue-router';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
interface RouteInfo {
  parent?: string;
  route: RouteRecordRaw;
}

export class PluginRoutes {
  router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  public logRoutes(routes: RouteRecordRaw[], indent = 0) {
    const spaces = Array(indent).join(' ');

    routes.forEach((route: RouteRecordRaw) => {
      console.log(`${ spaces }${ route.name?.toString() } -> ${ route.path }`); // eslint-disable-line no-console
      this.logRoutes(route.children || [], indent + 2);
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

    this.forEachNestedRoutes(newRoutes, (route: RouteRecordRaw) => {
      // Patch colliding legacy routes that start /:product
      if (route.path?.startsWith('/:product')) {
        // Legacy pattern used by extensions - routes may collide, so modify them not to
        let productName;

        // If the route has a name (which is always the case for the extensions we have written), use it to get the product name
        if (route.name && typeof route.name === 'string') {
          const nameParts = route.name.split('-');

          // First part of the route name is the product name
          productName = nameParts[0];
        }

        // Use the plugin name as the product, if the route does not have a name
        productName = productName || plugin.name;

        // Replace the path - removing :product and using the actual product name instead - this avoids route collisions
        route.path = `/${ productName }${ route.path.substr(9) }`;
        route.meta = route.meta || {};

        route.meta.product = route.meta.product || productName;
      }
    });

    this.updateMatcher(newRouteInfos, allRoutes);
  }

  private updateMatcher(newRoutes: RouteInfo[], allRoutes: RouteRecordRaw[]) {
    // Note - Always use a new router and replace the existing router's matching
    // Using the existing router and adding routes to it will force nuxt middleware to
    // execute many times (nuxt middleware boils down to route.beforeEach). This issue was seen refreshing in a harvester cluster with a
    // dynamically loaded cluster

    if (newRoutes.length === 0) {
      return;
    }

    const orderedPluginRoutes: RouteRecordRaw[] = [];

    // separate plugin routes that have parent and not, you want to push the new routes in REVERSE order to the front of the existing list so that the order of routes specified by the extension is preserved
    newRoutes.reverse().forEach((routeInfo: RouteInfo) => {
      let foundParentRoute;

      if (routeInfo.parent) {
        foundParentRoute = this.findInNestedRoutes(allRoutes, (route: RouteRecordRaw) => route.name === routeInfo.parent);

        if (foundParentRoute) {
          foundParentRoute.children = foundParentRoute?.children || [];
          foundParentRoute.children.unshift(routeInfo.route);
        }
      }

      if (!foundParentRoute) {
        orderedPluginRoutes.unshift(routeInfo.route);
      }
    });

    this.router.clearRoutes();

    const allRoutesToAdd = [...orderedPluginRoutes, ...allRoutes];

    allRoutesToAdd.forEach((route) => this.router.addRoute(route));
  }

  /**
   * Traverse the entire tree of nested routes
   *
   * @param routes The routes we wish to traverse through
   * @param fn -> Return true if you'd like to break the loop early (small)
   * @returns {@boolean} -> Returns true if breaking early
   */
  private forEachNestedRoutes(
    routes: RouteRecordRaw[] = [],
    fn: (route: RouteRecordRaw) => boolean | undefined | void
  ) {
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
  private findInNestedRoutes(
    routes: RouteRecordRaw[] = [],
    fn: (route: RouteRecordRaw) => boolean
  ): RouteRecordRaw | undefined {
    let found: RouteRecordRaw | undefined;

    this.forEachNestedRoutes(routes, (route) => {
      if (fn(route)) {
        found = route;

        return true;
      }
    });

    return found;
  }
}
