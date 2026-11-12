/**
 * Importing an SVG yields the URL the bundler serves it from.
 */
declare module '*.svg' {
  const src: string;

  export default src;
}
