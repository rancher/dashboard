type Listener = () => void;

/**
 * One observer for every element watched: a table can hold hundreds of cells and the side menu
 * a hundred labels, and one observer each would be hundreds of observers
 */
const listeners = new Map<Element, Listener>();

let observer: ResizeObserver | null = null;

/** Calls `onResize` whenever `el` changes size, until the returned function is called */
export function observeResize(el: Element, onResize: Listener): Listener {
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  observer = observer || new ResizeObserver((entries) => entries.forEach((entry) => listeners.get(entry.target)?.()));
  listeners.set(el, onResize);
  observer.observe(el);

  return () => {
    listeners.delete(el);
    observer?.unobserve(el);
  };
}
