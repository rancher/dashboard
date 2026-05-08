import { createRouter, createWebHistory } from 'vue-router';
import Routes from '@shell/config/router/routes';
import { installNavigationGuards } from '@shell/config/router/navigation-guards';
import { extendRouter as ER } from '@shell/plugins/extend-router';

export const routerOptions = {
  history:  createWebHistory(process.env.routerBase || '/'),
  // Note: router base comes from the ROUTER_BASE env var
  base:     process.env.routerBase || '/',
  routes:   Routes,
  fallback: false,
  scrollBehavior(to, from, savedPosition) {
    // Returning the savedPosition will result in a native-like behavior when
    // navigating with back/forward buttons
    if (savedPosition) {
      return savedPosition;
    }

    // Simulate the "scroll to anchor" behavior when the hash changes.
    // For example, the skip to content link
    if (to.hash) {
      const el = document.getElementById(to.hash.slice(1));

      el?.focus();

      return { el: to.hash };
    }
  },
};

export function extendRouter(config, context) {
  const base = (config._app && config._app.basePath) || routerOptions.base;
  const router = createRouter({
    ...routerOptions,
    base,
  });

  ER(router);

  installNavigationGuards(router, context);

  return router;
}
