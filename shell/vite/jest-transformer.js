/**
 * A jest transformer that runs another transformer on code that uses vite's `import.meta` features, which jest's
 * CommonJS modules do not have: `import.meta.glob()` becomes an object of `require()`s (an eager glob requires each
 * module the first time it is read) and `import.meta.hot` becomes `undefined`.
 *
 * Configure it with the transformer to run afterwards, for example
 * `'^.+\\.js$': ['@rancher/shell/vite/jest-transformer.js', { transformer: 'babel-jest' }]`
 */
const path = require('path');
const { globSync } = require('tinyglobby');

const GLOB_CALL = /import\.meta\.glob(?:<[^>()]*>)?\(([^()]*?)\)/g;
const HOT = /import\.meta\.hot\b/g;

const interop = '(m) => (m && m.__esModule ? m.default : m)';

function globSource(args, filename) {
  const [patterns, options = {}] = new Function(`return [${ args }];`)(); // eslint-disable-line no-new-func
  const dir = path.dirname(filename);
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const toAbsolute = (pattern) => (pattern.startsWith('**') ? pattern : path.posix.join(dir, pattern));
  const files = globSync(list.filter((p) => !p.startsWith('!')).map(toAbsolute), {
    cwd: '/', absolute: true, expandDirectories: false, ignore: list.filter((p) => p.startsWith('!')).map((p) => toAbsolute(p.slice(1)))
  }).sort();

  const entries = files.map((file) => {
    const rel = path.relative(dir, file).split(path.sep).join('/');
    const key = JSON.stringify(rel.startsWith('.') ? rel : `./${ rel }`);
    const required = options.import === 'default' ? `(${ interop })(require(${ JSON.stringify(file) }))` : `require(${ JSON.stringify(file) })`;

    return options.eager ? `get ${ key }() { return ${ required }; }` : `${ key }: () => Promise.resolve().then(() => ${ required })`;
  });

  return `({ ${ entries.join(', ') } })`;
}

function rewrite(source, filename) {
  if (!source.includes('import.meta')) {
    return source;
  }

  return source
    .replace(GLOB_CALL, (call, args) => {
      try {
        return globSource(args, filename);
      } catch (e) {
        return call;
      }
    })
    .replace(HOT, 'undefined');
}

function load(transformer, options) {
  const mod = require(transformer);
  const impl = mod.default || mod;

  return typeof impl.createTransformer === 'function' ? impl.createTransformer(options) : impl;
}

module.exports = {
  rewrite,

  createTransformer({ transformer, options } = {}) {
    const inner = load(transformer, options);

    return {
      canInstrument: inner.canInstrument,

      getCacheKey(source, filename, ...rest) {
        return inner.getCacheKey ? inner.getCacheKey(rewrite(source, filename), filename, ...rest) : undefined;
      },

      process(source, filename, ...rest) {
        return inner.process(rewrite(source, filename), filename, ...rest);
      },
    };
  },
};
