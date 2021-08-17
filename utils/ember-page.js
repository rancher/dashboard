
export const EMBER_FRAME = 'ember-iframe';
let inactiveRemoveTimer;

// Remove the IFrame if the user has not used an embedded page after this time
// since last visiting an embedded page
const INACTIVITY_CHECK_TIMEOUT = 60000;

export function findEmberPage() {
  return document.getElementById(EMBER_FRAME);
}

export function clearEmberInactiveTimer() {
  clearTimeout(inactiveRemoveTimer);
}

export function startEmberInactiveTimer() {
  if (findEmberPage() !== null) {
    inactiveRemoveTimer = setTimeout(removeEmberPage, INACTIVITY_CHECK_TIMEOUT);
  }
}

export function removeEmberPage() {
  const iframeEl = findEmberPage();

  if (iframeEl !== null) {
    iframeEl.remove();
    clearEmberInactiveTimer();
  }
}
