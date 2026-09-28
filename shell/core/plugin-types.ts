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
