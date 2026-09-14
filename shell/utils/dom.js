export function getParent(el, parentSelector) {
  el = el?.parentElement;

  if (!el) {
    return null;
  }

  const matchFn = el.matches || el.matchesSelector;

  if (!matchFn.call(el, parentSelector)) {
    return getParent(el, parentSelector);
  }

  return el;
}

// The modal surface. AppModal teleports this container into the page for as long as a modal is up, and
// the shortcut plugin is installed with it as a `preventContainer`, which is how every `v-shortkey`
// binding falls silent while a modal is up.
export const MODAL_CONTAINER_SELECTOR = '#modal-container-element';

// The cluster-switcher flyout: a modal in all but name — a panel over a full-page scrim, with its own
// search box and keyboard. Registered as a `preventContainer` too, so app shortcuts stand down while it
// is open exactly as they do for a dialog, and the flyout owns the few keys it acts on itself.
export const SWITCHER_POPPER_CLASS = 'cluster-switcher-popper';
export const SWITCHER_POPPER_SELECTOR = `.${ SWITCHER_POPPER_CLASS }`;
