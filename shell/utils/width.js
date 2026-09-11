/**
 * Sets the width of a DOM element. Adapted from [youmightnotneedjquery.com](https://youmightnotneedjquery.com/#set_width)
 * @param {Element | null | undefined} el - The target DOM element, ignored when there isn't one
 * @param {function | string | number} val - The desired width represented as a Number
 */
export function setWidth(el, val) {
  if (!el) {
    return;
  }

  if (typeof val === 'function') {
    val = val();
  }

  if (typeof val === 'string') {
    el.style.width = val;

    return;
  }

  el.style.width = `${ val }px`;
}

/**
 * Gets the width of a DOM element. Adapted from [youmightnotneedjquery.com](https://youmightnotneedjquery.com/#get_width)
 * @param {Element | ArrayLike<Element> | null | undefined} el - An array-like of elements, of which
 * the first is measured. A single `Element` is accepted by callers but always returns `undefined`:
 * the `!el.length` guard below returns early for anything without a `length`, so the `else` branch
 * that would measure it is unreachable.
 * @returns {number | undefined} Number representing the width of the first element, or undefined
 * when there is nothing to measure
 */
export function getWidth(el) {
  if (!el || !el.length) {
    return;
  }

  if (el.length) {
    return parseFloat(getComputedStyle(el[0]).width.replace('px', ''));
  } else {
    return parseFloat(getComputedStyle(el).width.replace('px', ''));
  }
}
