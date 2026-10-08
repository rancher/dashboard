/** Where a navigation under way is going, from its first guard until it settles; null between them */
let pending = null;

/** Whether a navigation is under way: a page still loading has not taken over from the one on screen */
export function isNavigating() {
  return !!pending;
}

/** Installed first, so a navigation counts as under way while the guards after it are still working */
export function install(router) {
  router.beforeEach((to, from, next) => {
    pending = to;
    next();
  });

  // After a navigation that settled, failed or was called off; a later one may have started meanwhile
  router.afterEach((to) => {
    if (pending === to) {
      pending = null;
    }
  });

  router.onError(() => {
    pending = null;
  });
}
