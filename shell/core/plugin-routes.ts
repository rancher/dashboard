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

  private tagRoute(route: RouteRecordRaw): void {
    route.meta = { ...route.meta, _extensionRoute: true };
    route.children?.forEach((child) => this.tagRoute(child));
  }

  public addRoutes(newRouteInfos: RouteInfo[]) {
    newRouteInfos.forEach((routeInfo) => {
      this.tagRoute(routeInfo.route);
      if (routeInfo.parent) {
        this.router.addRoute(routeInfo.parent, routeInfo.route);
      } else {
        this.router.addRoute(routeInfo.route);
      }
    });
  }
}
