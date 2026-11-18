/**
 * Jest transformer that stubs out asset imports (svg, images, fonts, media).
 *
 * Webpack turns these into URLs at build time; Jest has no equivalent, so each
 * import is replaced with an empty module instead of being parsed as JavaScript.
 */
module.exports = {
  process() {
    return { code: 'module.exports = {};' };
  },
  getCacheKey() {
    return 'svgTransform';
  },
};
