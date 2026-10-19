/**
 * Add a library's styles to the page when its script runs, rather than emitting a separate stylesheet, so that the
 * script is all there is to load
 */
export function injectStyles() {
  return {
    name:    'rancher:inject-styles',
    apply:   'build',
    enforce: 'post',

    generateBundle(options, bundle) {
      const styles = Object.values(bundle).filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'));
      const entry = Object.values(bundle).find((file) => file.type === 'chunk' && file.isEntry);

      if (!styles.length || !entry) {
        return;
      }

      const css = styles.map((file) => file.source).join('\n');
      const inject = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.appendChild(document.createTextNode(${ JSON.stringify(css) }));document.head.appendChild(s);}})();\n`;
      const sourceMap = entry.code.lastIndexOf('//# sourceMappingURL=');

      styles.forEach((file) => delete bundle[file.fileName]);
      entry.code = sourceMap === -1 ? `${ entry.code }\n${ inject }` : `${ entry.code.slice(0, sourceMap) }${ inject }${ entry.code.slice(sourceMap) }`;
    },
  };
}
