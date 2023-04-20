import { ExtensionMetadata } from './index';
import { RouteConfig } from 'vue-router';

export interface IRouter {
   /**
    * Add a new {@link RouteConfig | route record} as the child of an existing route. If the route has a `name` and there
    * is already an existing one with the same one, it overwrites it.
    *
    * @param parentName - Parent Route Record where `route` should be appended at
    * @param route - Route Record to add
    */
    addRoute(parentName: string, route: RouteConfig): void;
    /**
     * Add a new {@link RouteConfig | route} to the router. If the route has a `name` and there is already an existing one
     * with the same one, it overwrites it.
     * @param route - Route Record to add
     */
    addRoute(route: RouteConfig): void; // eslint-disable-line no-dupe-class-members
}

export default class Router implements IRouter {
  private _app: any;
  private _metadata: ExtensionMetadata;

  constructor(metadata: ExtensionMetadata, app: any) {
    this._metadata = metadata;
    this._app = app;
  }

  addRoute(first: string | RouteConfig, second?: RouteConfig) { // eslint-disable-line no-dupe-class-members
    this._app.router.addRoute(first);
  }
}
