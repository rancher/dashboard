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

  public addRoutes(newRouteInfos: RouteInfo[]) {
    console.log('Adding routes:', newRouteInfos); // eslint-disable-line no-console

    newRouteInfos.forEach((routeInfo) => {
      if (routeInfo.parent) {
        this.router.addRoute(routeInfo.parent, routeInfo.route);
      } else {
        this.router.addRoute(routeInfo.route);
      }
    });
  }
}
