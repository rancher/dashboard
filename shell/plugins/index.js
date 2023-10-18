/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
export function loadDirectives() {
  import('./clean-html-directive');
  import('./clean-tooltip-directive');
  import('./directives');
}
