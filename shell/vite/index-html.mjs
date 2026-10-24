import fs from 'node:fs';
import path from 'node:path';

/**
 * Serve and build the shell's index.html template as the app's index.html, with the shell's entry as its script,
 * so that an app does not need an index.html of its own
 *
 * @param {{ root: string, shellDir: string }} options the app's root directory and the shell's directory
 */
export function rancherIndexHtml({ root, shellDir }) {
  const template = path.join(shellDir, 'public', 'index.html');
  const entry = path.join(shellDir, 'initialize', 'entry.js');
  const id = path.join(root, 'index.html');
  const src = `/${ path.relative(root, entry).split(path.sep).join('/') }`;

  const html = () => fs.readFileSync(template, 'utf8').replace('</body>', `  <script type="module" src="${ src }"></script>\n</body>`);

  return {
    name: 'rancher:index-html',

    config() {
      return { build: { rolldownOptions: { input: id } } };
    },

    resolveId(source) {
      return source === id ? id : undefined;
    },

    load(loadId) {
      return loadId === id ? html() : undefined;
    },

    configureServer(server) {
      server.watcher.add(template);

      return () => {
        server.middlewares.use(async(req, res, next) => {
          if (req.url?.split('?')[0] !== '/index.html') {
            return next();
          }

          try {
            const out = await server.transformIndexHtml(req.originalUrl || req.url, html());

            res.setHeader('Content-Type', 'text/html');
            res.end(out);
          } catch (e) {
            next(e);
          }
        });
      };
    },
  };
}
