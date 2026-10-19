const injection = (css) => `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.appendChild(document.createTextNode(${ JSON.stringify(css) }));document.head.appendChild(s);}})();\n`;

function append(chunk, code) {
  const sourceMap = chunk.code.lastIndexOf('//# sourceMappingURL=');

  chunk.code = sourceMap === -1 ? `${ chunk.code }\n${ code }` : `${ chunk.code.slice(0, sourceMap) }${ code }${ chunk.code.slice(sourceMap) }`;
}

/**
 * Add a library's styles to the page when its scripts run, rather than emitting separate stylesheets, so that the
 * scripts are all there is to load. Each chunk adds the styles of its own modules, so the styles of a chunk that is
 * loaded on demand are added when it is loaded.
 */
export function injectStyles() {
  return {
    name:    'rancher:inject-styles',
    apply:   'build',
    enforce: 'post',

    generateBundle(options, bundle) {
      const files = Object.values(bundle);
      const styles = files.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'));
      const chunks = files.filter((file) => file.type === 'chunk');
      const entry = chunks.find((chunk) => chunk.isEntry);
      const claimed = new Set();

      chunks.forEach((chunk) => {
        const own = [...(chunk.viteMetadata?.importedCss || [])].filter((fileName) => bundle[fileName]);

        own.forEach((fileName) => claimed.add(fileName));

        if (own.length) {
          append(chunk, injection(own.map((fileName) => bundle[fileName].source).join('\n')));
        }
      });

      const rest = styles.filter((file) => !claimed.has(file.fileName));

      if (rest.length && entry) {
        append(entry, injection(rest.map((file) => file.source).join('\n')));
      }

      styles.forEach((file) => delete bundle[file.fileName]);
    },
  };
}
