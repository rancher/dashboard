export default function({ app }) {
  window.addEventListener('popstate', () => {
    window._popStateDetected = true;
  });

  app.router.afterEach((to, from) => {
    // Clear state used to record if back button was used for navigation
    setTimeout(() => {
      window._popStateDetected = false;
    }, 1);
  });
}
