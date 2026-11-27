/**
 * `shell/vite/loaders.mjs` parses YAML imports, so an import yields the
 * parsed document as the default export.
 */
declare module '*.yaml' {
  const content: Record<string, any>;

  export default content;
}
