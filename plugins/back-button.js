if ( process.client ) {
  window.addEventListener('popstate', () => {
    window._popStateDetected = true;
  });
}
