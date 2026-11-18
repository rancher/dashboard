/**
 * `shell/vue.config.js` runs YAML through `js-yaml-loader`, so an import yields the
 * parsed document as the default export.
 */
declare module '*.yaml' {
  const content: Record<string, any>;

  export default content;
}
