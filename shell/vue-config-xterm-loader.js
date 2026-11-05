/**
 * Webpack loader that hides the `process` polyfill from the xterm.js packages.
 *
 * xterm 6 thinks it is running in Node when `process.title` exists. The `process` polyfill
 * (see NodePolyfillPlugin in vue.config.js) sets `process.title`, so xterm turns off all of its
 * browser and OS checks (Firefox, Safari, Mac, Windows, Linux). One result is that right click
 * paste does not work in Firefox.
 *
 * Declaring a module level `process` stops webpack from providing the polyfill to these modules.
 *
 * This can be removed once xterm is upgraded to a version with the fix (6.1.0 or later).
 */
module.exports = function(source) {
  // Keep it on the first line so the line numbers do not change
  return `var process;${ source }`;
};
