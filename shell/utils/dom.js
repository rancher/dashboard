export function getParent(el, parentSelector) {
  while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el, parentSelector))) { }

  return el;
}
