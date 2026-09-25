/**
 * How long a search box waits, after the last keystroke, before anything acts on what was typed.
 *
 * Every one of these boxes filters something expensive - a list re-filtered and re-rendered, a
 * request to the api, a count fetched per tab - and running that on each keystroke turns typing
 * into a series of jolts. The box itself stays live either way; this is only how long whatever
 * reads it holds off.
 *
 * One number for all of them so the product types at one speed. It was found on the cluster
 * switcher's search, which is where the problem was noticed first.
 */
export const SEARCH_DEBOUNCE = 400;
