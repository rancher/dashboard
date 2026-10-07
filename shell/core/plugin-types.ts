import { RouteRecordRaw } from 'vue-router';

export type RouteRecordRawWithParams = Omit<RouteRecordRaw, 'redirect' | 'children' | 'path'> & {
  /** Path for route - can include dynamic segments like ':id'. Based on vue-router routes */
  path?: string;
  /** Params for route - key-value pairs representing route parameters */
  params?: Record<string, any>;
  /** Child routes */
  children?: RouteRecordRawWithParams[];
  /** Optional redirect */
  redirect?: RouteRecordRaw['redirect'];
};

/**
 * A route as a plugin records it, ready to be handed to vue-router
 */
export interface PluginRouteInfo {
  parent?: string;
  route: RouteRecordRaw | RouteRecordRawWithParams;
}

/**
 * Adds routes to vue-router straight away, for routes generated after the extension's own routes
 * were handed to it
 */
export type AddLateRoutes = (routes: PluginRouteInfo[]) => void;
