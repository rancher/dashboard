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

// Focused elements that own the keyboard, so the shortcut plugin (installed with these as `prevent`) lets
// their keys through instead of firing app shortcuts. CodeMirror 6 takes focus on a contenteditable
// `.cm-content` rather than a textarea, and read-only editors mark it contenteditable="false" but keep it
// focusable, so any contenteditable value counts. Without it Ctrl+K opens the nav search instead of
// reaching the editor's Emacs kill-line.
export const SHORTKEY_PREVENT_SELECTORS = ['input', 'textarea', 'select', '[contenteditable]'];
