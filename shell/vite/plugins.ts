/**
 * Vite equivalents of the webpack loaders/plugins used by shell/vue.config.js:
 *
 * - yamlPlugin:           js-yaml-loader (yaml files import as parsed objects)
 * - workerPlugin:         worker-loader for web-worker.<name>.js files
 * - pkgAliasPlugin:       NormalModuleReplacementPlugin for @pkg (package-relative resolution)
 * - virtualModulesPlugin: webpack-virtual-modules for @rancher/dynamic and @rancher/auto-import
 * - serverMiddlewarePlugin: dev-server middleware (verify-auth redirects)
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const jsyaml = require('js-yaml');
const { contextFolders, COMPAT_SHIM } = require('../pkg/auto-import.js');

const RUNTIME_HELPER = '@shell/vite/webpack-compat-runtime';

/**
 * Import .yaml/.yml files as parsed javascript objects (i18n translations).
 */
export function yamlPlugin(): Plugin {
  return {
    name:    'rancher:yaml',
    enforce: 'pre',

    transform(code: string, id: string) {
      if (!/\.ya?ml(\?.*)?$/.test(id)) {
        return null;
      }

      const data = jsyaml.load(code);

      return { code: `export default ${ JSON.stringify(data) };`, map: null };
    },
  };
}

/**
 * Mirror webpack's worker-loader rule: any import of a file named
 * web-worker.<name>.js resolves to a Worker constructor. Inline (blob) workers
 * are used so the production dashboard keeps working when served from a CDN
 * (workers cannot be loaded cross-origin).
 */
export function workerPlugin(): Plugin {
  return {
    name: 'rancher:worker-loader',

    // 'pre' so this sees the import before Vite's alias plugin fully resolves it
    enforce: 'pre',

    async resolveId(source, importer) {
      if (!/web-worker\.[a-z-]+\.js$/i.test(source)) {
        return null;
      }

      const resolved = await this.resolve(source, importer, { skipSelf: true });

      return resolved ? `${ resolved.id }?worker&inline` : null;
    },
  };
}

/**
 * '@pkg' imports resolve relative to the package importing them, mirroring
 * getPackageImport() in shell/vue.config.js.
 */
export function pkgAliasPlugin(dir: string): Plugin {
  return {
    name:    'rancher:pkg-alias',
    enforce: 'pre',

    async resolveId(source, importer) {
      if (!source.startsWith('@pkg/') || !importer) {
        return null;
      }

      const request = source.substr(5);
      const parts = importer.split('/');
      const index = parts.findIndex((s) => s === 'pkg');
      let target = path.resolve(dir, 'pkg', request);

      if (index !== -1 && (index + 1) < parts.length) {
        const pkg = parts[index + 1];

        if (!request.startsWith(`${ pkg }/`)) {
          target = path.resolve(dir, 'pkg', pkg, request);
        }
      }

      return await this.resolve(target, importer, { skipSelf: true });
    },
  };
}

const DYNAMIC_ID = '@rancher/dynamic';
const AUTO_IMPORT_ID = '@rancher/auto-import';

function pkgEntry(dir: string, name: string): string | undefined {
  return ['index.ts', 'index.js'].map((f) => path.join(dir, 'pkg', name, f)).find((f) => fs.existsSync(f));
}

/**
 * Vite flavour of generateDynamicTypeImport() from shell/pkg/auto-import.js:
 * registers models/edit/detail/list etc of a built-in package with the
 * extension manager via import.meta.glob maps.
 */
function generateAutoImport(dir: string, name: string): string {
  let content = `import { registerContextFolder } from '${ RUNTIME_HELPER }';\n`;

  content += 'export function importTypes($extension) {\n';
  content += COMPAT_SHIM;

  contextFolders.forEach((folder) => {
    if (!fs.existsSync(path.join(dir, 'pkg', name, folder))) {
      return;
    }

    // Models are looked up synchronously (see shell/plugins/dashboard-store/model-loader.js), so they
    // must be eagerly imported. Everything else is registered lazily, matching webpack's () => import(...)
    const eager = folder === 'models' ? ', { eager: true }' : '';
    const prefix = `/pkg/${ name }/${ folder }/`;
    const glob = `'${ prefix }**/*.{vue,js,ts,yaml}', '!**/__tests__/**', '!**/*.test.*', '!**/*.d.ts'`;

    content += `  registerContextFolder($extension, '${ folder }', import.meta.glob([${ glob }]${ eager }), '${ prefix }');\n`;
  });

  content += '};\n';

  return content;
}

/**
 * Generates the '@rancher/dynamic' module that imports all built-in packages
 * (mirrors getVirtualModules() in shell/vue.config.js) and resolves the
 * per-package '@rancher/auto-import' modules.
 */
export function virtualModulesPlugin(dir: string, includePkg: (name: string) => boolean): Plugin {
  return {
    name:    'rancher:virtual-modules',
    enforce: 'pre',

    resolveId(source, importer) {
      if (source === DYNAMIC_ID) {
        return `\0${ DYNAMIC_ID }`;
      }

      if (source === AUTO_IMPORT_ID && importer) {
        const parts = importer.split('/');
        const index = parts.findIndex((s) => s === 'pkg');

        if (index !== -1 && (index + 1) < parts.length) {
          return `\0${ AUTO_IMPORT_ID }/${ parts[index + 1] }`;
        }
      }

      if (source.startsWith(`${ AUTO_IMPORT_ID }/`)) {
        return `\0${ source }`;
      }

      return null;
    },

    load(id) {
      if (id === `\0${ DYNAMIC_ID }`) {
        const imports = [];
        const registrations = [];

        if (fs.existsSync(path.join(dir, 'pkg'))) {
          fs.readdirSync(path.join(dir, 'pkg'))
            .filter((name) => !name.startsWith('.'))
            .forEach((name) => {
              const pkgPath = path.join(dir, 'pkg', name, 'package.json');

              if (!fs.existsSync(pkgPath)) {
                return;
              }

              const library = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
              const entry = pkgEntry(dir, name);

              if (includePkg(name) && library.rancher && entry) {
                const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_');

                imports.push(`import * as pkg_${ safeName } from '${ entry }';`);
                registrations.push(`  $extension.registerBuiltinExtension('${ name }', pkg_${ safeName });`);
              }
            });
        }

        // UI packages installed as npm dependencies (package.json with a 'rancher' property)
        const appPkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));

        Object.keys(appPkg.dependencies || {}).forEach((dep) => {
          const depPkgPath = path.join(dir, 'node_modules', dep, 'package.json');

          if (!fs.existsSync(depPkgPath)) {
            return;
          }

          const library = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));

          if (library.rancher) {
            const id = `${ library.name }-${ library.version }`;

            registrations.push(`  $extension.loadAsync('${ id }', '/pkg/${ id }/${ library.main }');`);
          }
        });

        return `${ imports.join('\n') }\nexport default function ($extension) {\n${ registrations.join('\n') }\n};\n`;
      }

      if (id.startsWith(`\0${ AUTO_IMPORT_ID }/`)) {
        const name = id.substr(`\0${ AUTO_IMPORT_ID }/`.length);

        return generateAutoImport(dir, name);
      }

      return null;
    },
  };
}

/**
 * Serve and build the app from the same shell/public/index.html template the
 * webpack build uses, so no separate root index.html is needed. The Vite
 * module entry script (and a small process shim) are injected at transform
 * time, leaving the template itself untouched for webpack.
 */
export function htmlPlugin(shellAbs: string): Plugin {
  const htmlPath = path.join(shellAbs, 'public', 'index.html');
  let base = '/';
  // Minimal process shim for third-party code that probes process.env at runtime
  // (statically analyzable process.env.* accesses are replaced via `define`)
  const processShim = 'window.process = window.process || { env: {}, client: true, server: false, browser: true };';

  return {
    name: 'rancher:index-html',

    config() {
      return { build: { rollupOptions: { input: htmlPath } } };
    },

    configResolved(config) {
      base = config.base || '/';
    },

    transformIndexHtml: {
      // 'pre' so the injected entry script is seen (and bundled) by Vite's own
      // html processing during build
      order: 'pre',
      handler(html: string) {
        return {
          html,
          tags: [
            {
              tag: 'script', children: processShim, injectTo: 'head-prepend'
            },
            {
              tag: 'script', attrs: { type: 'module', src: '/shell/initialize/entry.vite.js' }, injectTo: 'body'
            },
          ],
        };
      },
    },

    // Serve the template for html navigation requests in dev (there is no
    // index.html in the project root for Vite to pick up itself)
    configureServer(server) {
      return () => {
        server.middlewares.use(async(req, res, next) => {
          const url = req.url || '/';
          const isHtml = url === '/' || url.startsWith('/index.html') || (req.headers.accept || '').includes('text/html');

          if (req.method !== 'GET' || !isHtml) {
            return next();
          }

          try {
            // With experimental.bundledDev the html is built (and its entry
            // script rewritten to bundle urls) into the in-memory output at the
            // input's path; serve that rather than the raw template
            const bundledDev = (server.environments?.client as any)?.bundledDev;
            const memoryHtml = bundledDev?.memoryFiles?.get('shell/public/index.html');

            if (memoryHtml) {
              res.setHeader('Content-Type', 'text/html');
              res.end(typeof memoryHtml.source === 'string' ? memoryHtml.source : Buffer.from(memoryHtml.source));

              return;
            }

            const template = fs.readFileSync(htmlPath, 'utf8');
            const html = await server.transformIndexHtml(url, template, req.originalUrl);

            res.setHeader('Content-Type', 'text/html');
            res.end(html);
          } catch (e) {
            next(e);
          }
        });
      };
    },

    // The html input lives at shell/public/index.html, so Vite emits it there;
    // move it to the root of the output directory. Done in writeBundle because
    // Vite's own build-html plugin emits the asset after user generateBundle
    // hooks have run.
    writeBundle(options, bundle) {
      const outDir = options.dir;

      if (!outDir) {
        return;
      }

      const emitted = path.join(outDir, 'shell', 'public', 'index.html');

      if (fs.existsSync(emitted)) {
        fs.renameSync(emitted, path.join(outDir, 'index.html'));

        // Clean up the now-empty shell/public folders
        for (const dir of [path.join(outDir, 'shell', 'public'), path.join(outDir, 'shell')]) {
          if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
            fs.rmdirSync(dir);
          }
        }
      }

      // The boot sequence is a serial chain of dynamic imports (entry ->
      // preload models -> main app chunk). Inject modulepreload links for
      // those chunks and their static imports so the browser fetches the whole
      // chain in parallel with the first request.
      const htmlFile = path.join(outDir, 'index.html');
      const chunks = Object.values(bundle).filter((c: any) => c.type === 'chunk') as any[];
      const bootChunks = chunks.filter((c) => {
        return c.facadeModuleId?.endsWith('shell/initialize/entry.js') || /^(models|shell-shared|vendor-shared)-/.test(c.fileName.split('/').pop() || '');
      });
      const preload = new Set<string>();
      const collect = (fileName: string) => {
        if (preload.has(fileName)) {
          return;
        }
        preload.add(fileName);
        const chunk = chunks.find((c) => c.fileName === fileName);

        (chunk?.imports || []).forEach(collect);
      };

      bootChunks.forEach((c) => collect(c.fileName));

      if (preload.size && fs.existsSync(htmlFile)) {
        const html = fs.readFileSync(htmlFile, 'utf8');
        const links = [...preload]
          .filter((f) => !html.includes(f)) // vite already preloads the entry's own static imports
          .map((f) => `    <link rel="modulepreload" crossorigin href="${ base }${ f }">`)
          .join('\n');

        if (links) {
          fs.writeFileSync(htmlFile, html.replace('</head>', `${ links }\n</head>`));
        }
      }
    },
  };
}

/**
 * Install the same express-style middlewares the webpack dev server uses
 * (currently just the /verify-auth redirects).
 */
export function serverMiddlewarePlugin(serverMiddlewares: any): Plugin {
  return {
    name: 'rancher:server-middleware',

    configureServer(server) {
      server.middlewares.use(serverMiddlewares);
    },
  };
}
