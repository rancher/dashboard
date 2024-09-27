export function install(router, context) {
  router.beforeEach((to, from, next) => loadHistory(to, from, next, context));
}

export async function loadHistory(to, from, next) {
  // Clear state used to record if back button was used for navigation
  // TODO: Investigate if this can be removed. This is only used on the templates/error.vue page and seems hacky.
  setTimeout(() => {
    window._popStateDetected = false;
  }, 1);

  next();
}
