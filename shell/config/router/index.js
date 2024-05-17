import Vue from 'vue';
import Router from 'vue-router';
import Routes from '@shell/config/router/routes';

Vue.use(Router);

export const routerOptions = {
  mode:     'history',
  // Note: router base comes from the ROUTER_BASE env var
  base:     process.env.routerBase || '/',
  routes:   Routes,
  fallback: false
};

export function extendRouter(config) {
  const base = (config._app && config._app.basePath) || routerOptions.base;
  const router = new Router({ ...routerOptions, base });

  return router;
}
