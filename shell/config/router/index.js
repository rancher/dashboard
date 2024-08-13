import { createApp } from 'vue';
import { createRouter } from 'vue-router';
import Routes from '@shell/config/router/routes';
import { installNavigationGuards } from '@shell/config/router/navigation-guards';
const vueApp = createApp({});

vueApp.use(Router);

export const routerOptions = {
  mode:     'history',
  // Note: router base comes from the ROUTER_BASE env var
  base:     process.env.routerBase || '/',
  routes:   Routes,
  fallback: false
};

export function extendRouter(config, context) {
  const base = (config._app && config._app.basePath) || routerOptions.base;
  const router = new Router({ ...routerOptions, base });

  installNavigationGuards(router, context);

  return router;
}
