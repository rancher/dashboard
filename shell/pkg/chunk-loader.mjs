import fs from 'node:fs';
import path from 'node:path';
import { MagicString } from 'vue/compiler-sfc';
import { isFunction, isMember, walk } from '../vite/ast.mjs';

const CHUNKS = 'self.__rancherExtensionChunks';
export const INITIAL_CHUNK = 'initial';

const CHUNK_RUNTIME = `
var chunks = ${ CHUNKS } || (${ CHUNKS } = {});
var modules = {};
var loading = {};
var script = document.currentScript;
var base = script && script.src ? new URL('.', script.src).href : '';
var file = function(id) { return id.replace(/^\\.\\//, ''); };
var key = function(f) { return name + '/' + f; };
empty.forEach(function(f) { chunks[key(f)] = function() {}; });
function load(f) {
  if (chunks[key(f)]) { return Promise.resolve(); }
  if (loading[f]) { return loading[f]; }
  var s = document.createElement('script');
  var loaded = loading[f] = new Promise(function(resolve, reject) {
    var fail = function() {
      delete loading[f];
      if (s.parentNode) { s.parentNode.removeChild(s); }
      reject(new Error('Could not load ' + s.src));
    };
    s.onload = function() { return chunks[key(f)] ? resolve() : fail(); };
    s.onerror = fail;
  });
  s.src = base + f;
  document.head.appendChild(s);
  return loaded;
}
function req(id) {
  if (globals[id]) { return window[globals[id]]; }
  var f = file(id);
  if (modules[f]) { return modules[f].ready || modules[f].exports; }
  if (!deps[f]) { throw new Error("Cannot find module '" + id + "'"); }
  var missing = [f].concat(deps[f]).filter(function(dep) { return !chunks[key(dep)]; });
  if (missing.length) { return Promise.all(missing.map(load)).then(function() { return req(id); }); }
  var module = modules[f] = { exports: {} };
  var forget = function(e) { delete modules[f]; throw e; };
  var running;
  try { running = chunks[key(f)](module, module.exports, req); } catch (e) { forget(e); }
  if (running) { module.ready = running.then(function() { module.ready = null; return module.exports; }, forget); return module.ready; }
  return module.exports;
}
req.loadModules = function(ids) {
  return Promise.resolve().then(function() { return Promise.all(ids.map(function(id) { return req(id); })); }).then(function() {});
};
req.importGlobal = function(id) {
  return Promise.resolve().then(function() {
    var m = req(id);
    if (m === undefined) { throw new Error("Cannot find module '" + id + "'"); }
    return m && m.__esModule ? m : Object.assign({}, m, { default: m });
  });
};
`;

const SOURCE_MAP_COMMENT = /\n?\/\/# sourceMappingURL=.*\n?$/;

const TOP_LEVEL_AWAIT = '__rancherTopLevelAwait';
const DYNAMIC_IMPORTS = ['Promise.resolve().then(', 'import('];
const CHUNK_PATH = /^\.\//;
const SCRIPT_TYPES = ['js', 'jsx', 'ts', 'tsx'];

function chunksThatAwait(chunks, awaitingModules) {
  const found = new Set();
  let changed = true;

  while (changed) {
    changed = false;

    Object.values(chunks).forEach((chunk) => {
      if (!found.has(chunk.fileName) && (chunk.moduleIds.some((id) => awaitingModules.has(id)) || chunk.imports.some((dep) => found.has(dep)))) {
        found.add(chunk.fileName);
        changed = true;
      }
    });
  }

  return found;
}

const isPromiseResolve = (node) => node.type === 'CallExpression' && !node.arguments.length && isMember(node.callee, 'resolve', 'Promise');
const isPromiseResolveThen = (node) => node.type === 'CallExpression' && isMember(node.callee, 'then') && isPromiseResolve(node.callee.object) && isFunction(node.arguments[0]);
const requiredPath = (node) => (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require' ? node.arguments[0]?.value : undefined);

function chunksRequiredBy(callback) {
  const chunks = new Set();

  walk(callback.body, (node, inFunction) => {
    const required = inFunction ? undefined : requiredPath(node);

    if (typeof required === 'string' && CHUNK_PATH.test(required)) {
      chunks.add(required);
    }
  });

  return [...chunks];
}

/**
 * A plugin that loads a package's lazily imported code when it is first used, as webpack did, rather than as part of
 * the script Rancher loads. Chunks are built as CommonJS, which turns a dynamic import into a `require()` inside a promise, and
 * each chunk registers itself as a function of `(module, exports, require)`. The script Rancher loads holds the entry
 * and everything it imports, and a `require` that runs a registered chunk, or loads the chunk's script (and those of
 * the chunks it needs) from beside it first. A dynamic import loads and runs the chunks it needs before the importing
 * code reads the module, and a dynamic import of an external module gives the external's global as a module.
 *
 * A module with a top-level `await` can be imported lazily, and the code that imports it waits for it. The entry, and
 * the chunks it imports, cannot wait, since the script Rancher loads sets the package on `window` straight away.
 *
 * @param {string} name the package's `<name>-<version>`, which the script sets on `window`
 * @param {string} fileName the script's file name
 * @param {Record<string, string>} globals the window global to use for each external module
 */
export function loadChunksOnDemand(name, fileName, globals = {}) {
  const awaitingModules = new Set();
  let awaitingChunks;
  let entry;
  let initial;
  let deps;

  const isGlobalImport = (node) => node.type === 'ImportExpression' && typeof node.source.value === 'string' && Object.hasOwn(globals, node.source.value);

  return {
    name:  'rancher:pkg-chunks-on-demand',
    apply: 'build',

    transform: {
      order:  'post',
      filter: { code: /\bawait\b/ },
      handler(code, id, meta) {
        if (!SCRIPT_TYPES.includes(meta.moduleType)) {
          return null;
        }

        let ast;

        try {
          ast = this.parse(code, { lang: meta.moduleType });
        } catch {
          return null;
        }

        const s = new MagicString(code);
        let awaits = false;

        walk(ast, (node, inFunction) => {
          if (inFunction) {
            return;
          }

          if (node.type === 'ForOfStatement' && node.await) {
            this.error(`${ id }: a top-level \`for await\` cannot be built into a package`);
          }

          if (node.type === 'AwaitExpression') {
            s.overwrite(node.start, node.start + 'await'.length, `${ TOP_LEVEL_AWAIT }(`);
            s.appendLeft(node.end, ')');
            awaits = true;
          }
        });

        if (!awaits) {
          return null;
        }

        awaitingModules.add(id);

        return { code: s.toString(), map: s.generateMap({ hires: true, source: id }) };
      },
    },

    buildStart() {
      awaitingModules.clear();
    },

    renderStart() {
      awaitingChunks = undefined;
    },

    renderChunk(code, chunk, options, meta) {
      const s = meta.magicString;

      awaitingChunks = awaitingChunks || chunksThatAwait(meta.chunks || {}, awaitingModules);

      const awaiting = awaitingChunks.has(chunk.fileName);
      const importsDynamically = DYNAMIC_IMPORTS.some((text) => code.includes(text));
      const ast = awaiting || importsDynamically ? this.parse(code) : undefined;

      if (importsDynamically) {
        walk(ast, (node) => {
          if (isPromiseResolveThen(node)) {
            const required = chunksRequiredBy(node.arguments[0]);

            if (required.length) {
              s.overwrite(node.callee.object.start, node.callee.object.end, `require.loadModules(${ JSON.stringify(required) })`);
            }
          } else if (isGlobalImport(node)) {
            s.overwrite(node.start, node.end, `require.importGlobal(${ JSON.stringify(node.source.value) })`);
          }
        });
      }

      if (awaiting) {
        const dir = path.posix.dirname(chunk.fileName);

        walk(ast, (node, inFunction) => {
          if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') {
            return;
          }

          if (node.callee.name === TOP_LEVEL_AWAIT) {
            if (inFunction) {
              this.error(`${ chunk.fileName }: a module with a top-level \`await\` is evaluated lazily in this chunk, so it cannot wait`);
            }
            s.overwrite(node.callee.start, node.callee.end, 'await ');
          } else if (node.callee.name === 'require' && !inFunction && typeof node.arguments[0]?.value === 'string' && awaitingChunks.has(path.posix.join(dir, node.arguments[0].value))) {
            s.prependRight(node.start, '(await ');
            s.appendLeft(node.end, ')');
          }
        });
      }

      s.prepend(`(${ CHUNKS } || (${ CHUNKS } = {}))[${ JSON.stringify(`${ name }/${ chunk.fileName }`) }] = ${ awaiting ? 'async ' : '' }function(module, exports, require) {'use strict';\n`);
      s.append('\n};\n');

      return s;
    },

    generateBundle(options, bundle) {
      const chunks = Object.values(bundle).filter((file) => file.type === 'chunk');
      const needs = (chunk, seen = new Set()) => chunk.imports
        .filter((dep) => bundle[dep] && !seen.has(dep) && seen.add(dep))
        .flatMap((dep) => [dep, ...needs(bundle[dep], seen)]);

      entry = chunks.find((chunk) => chunk.isEntry).fileName;
      initial = needs(bundle[entry]);

      const waiting = [entry, ...initial].flatMap((file) => bundle[file].moduleIds.filter((id) => awaitingModules.has(id)));

      if (waiting.length) {
        this.error(`The package's index imports a module with a top-level \`await\` (${ waiting.join(', ') }), and the script Rancher loads cannot wait for it: import that module with \`import()\` instead`);
      }

      deps = chunks.reduce((out, chunk) => {
        out[chunk.fileName] = needs(chunk).filter((dep) => dep !== entry && !initial.includes(dep));

        return out;
      }, {});
    },

    writeBundle(options, bundle) {
      const read = (file) => fs.readFileSync(path.join(options.dir, file), 'utf8');
      const readMap = (file) => (fs.existsSync(path.join(options.dir, file)) ? JSON.parse(read(file)) : { version: 3, sources: [], names: [], mappings: '' });
      const empty = Object.keys(deps).filter((file) => !bundle[file]);
      const written = (files) => files.filter((file) => !empty.includes(file));
      const writtenDeps = Object.fromEntries(Object.entries(deps).map(([file, needed]) => [file, written(needed)]));
      const parts = [...written(initial), entry];
      const sections = [];
      let code = '';

      parts.forEach((part) => {
        const partCode = read(part).replace(SOURCE_MAP_COMMENT, '\n');

        sections.push({ offset: { line: code.split('\n').length - 1, column: 0 }, map: readMap(`${ part }.map`) });
        code += partCode;
      });

      code += `window[${ JSON.stringify(name) }] = (function() {\nvar name = ${ JSON.stringify(name) };\nvar globals = ${ JSON.stringify(globals) };\nvar deps = ${ JSON.stringify(writtenDeps) };\nvar empty = ${ JSON.stringify(empty) };\n${ CHUNK_RUNTIME }\nreturn req(${ JSON.stringify(entry) });\n})();\n//# sourceMappingURL=${ fileName }.map\n`;

      parts.forEach((part) => {
        fs.rmSync(path.join(options.dir, part));
        fs.rmSync(path.join(options.dir, `${ part }.map`), { force: true });
      });
      fs.writeFileSync(path.join(options.dir, fileName), code);
      fs.writeFileSync(path.join(options.dir, `${ fileName }.map`), JSON.stringify({ version: 3, file: fileName, sections }));
    },
  };
}
