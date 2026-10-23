type Listener = () => void;

/**
 * Content can mount while hidden (e.g. inside a collapsed RcSection, which keeps its content mounted),
 * where it has no size. Anything that sizes itself from the DOM on mount then measures zero, and needs
 * to measure again once it is shown.
 *
 * One observer for every element watched, as a form can hold many of them
 */
const listeners = new Map<Element, Listener>();
const hidden = new Map<Element, boolean>();

let observer: ResizeObserver | null = null;

const isHidden = (el: Element) => {
  const { width, height } = el.getBoundingClientRect();

  return width === 0 && height === 0;
};

/**
 * Calls `onReveal` whenever `el` goes from hidden (no size) to shown, until the returned function is called.
 * Not called on mount if `el` is already shown.
 */
export function observeReveal(el: Element, onReveal: Listener): Listener {
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  observer = observer || new ResizeObserver((entries) => entries.forEach(({ target }) => {
    const wasHidden = hidden.get(target);
    const nowHidden = isHidden(target);

    hidden.set(target, nowHidden);

    if (wasHidden && !nowHidden) {
      listeners.get(target)?.();
    }
  }));

  listeners.set(el, onReveal);
  hidden.set(el, isHidden(el));
  observer.observe(el);

  return () => {
    listeners.delete(el);
    hidden.delete(el);
    observer?.unobserve(el);
  };
}
