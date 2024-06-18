export function install(router, context) {
  router.afterEach((to, from) => loadHistory(to, from, context));
}

export async function loadHistory(to, from, { store }) {
  // GC should be notified of route change before any find/get request is made that might be used for that page
  // Clear state used to record if back button was used for navigation
  setTimeout(() => {
    window._popStateDetected = false;
  }, 1);
}
