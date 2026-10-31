import http from 'node:http';
import https from 'node:https';
import serverMiddlewares from '../server/server-middleware.js';
import har from '../server/har-file.js';

function checkRancherVersionCompatibility(targetApi, shellRancherVersion) {
  if (!shellRancherVersion) return;

  const url = new URL('/rancherversion', targetApi);
  const protocol = url.protocol === 'https:' ? https : http;

  const req = protocol.get(
    {
      hostname:           url.hostname,
      port:               url.port || (url.protocol === 'https:' ? 443 : 80),
      path:               '/rancherversion',
      rejectUnauthorized: false,
    },
    (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const { Version } = JSON.parse(data);
          const targetMatch = Version?.match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/);
          const shellMatch = shellRancherVersion.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);

          if (targetMatch && shellMatch) {
            const targetMaj = parseInt(targetMatch[1], 10);
            const targetMin = parseInt(targetMatch[2], 10);
            const targetPatch = parseInt(targetMatch[3] || '0', 10);
            const shellMaj = parseInt(shellMatch[1], 10);
            const shellMin = parseInt(shellMatch[2], 10);
            const shellPatch = parseInt(shellMatch[3] || '0', 10);

            if (
              targetMaj < shellMaj ||
              (targetMaj === shellMaj && targetMin < shellMin) ||
              (targetMaj === shellMaj && targetMin === shellMin && targetPatch < shellPatch)
            ) {
              // eslint-disable-next-line no-console
              console.warn([
                '',
                '⚠️  Rancher version mismatch detected!',
                `   Target Rancher:        ${ Version }`,
                `   Shell compatible with: v${ shellRancherVersion }.x`,
                '   Whilst this may mostly work, there may be areas that won\'t',
                '   (where the shell depends on version-dependent Rancher features).',
                '   It\'s recommended to keep both target Rancher and app shell versions aligned.',
                '   This only affects `yarn dev`; building and loading extensions continues to work.',
                '',
              ].join('\n'));
            }
          }
        } catch { /* ignore malformed responses */ }
      });
    }
  );

  req.on('error', () => { /* ignore, the proxy surfaces connection errors */ });
  req.end();
}

/**
 * Dev server behavior that is not proxying: the auth redirect middleware (also used by `vite preview`), replaying
 * responses from a HAR file (HAR_FILE, and HAR_DIR for responses stored as files) and a warning when the target Rancher
 * is older than the shell
 *
 * @param {{ api: string, shellRancherVersion?: string }} options
 */
export function rancherDevServer({ api, shellRancherVersion }) {
  const harFile = process.env.HAR_FILE;

  return {
    name:  'rancher:dev-server',
    apply: 'serve',

    configResolved(config) {
      if (harFile) {
        Object.values(config.server.proxy || {}).forEach((options) => {
          options.ws = false;
        });
      }
    },

    configureServer(server) {
      server.middlewares.use(serverMiddlewares);

      if (harFile) {
        const harData = har.loadFile(harFile, server.config.server.port, '');

        console.log('Installing HAR file middleware'); // eslint-disable-line no-console
        server.middlewares.use(har.harProxy(harData, process.env.HAR_DIR));

        server.httpServer?.on('upgrade', (req, socket) => {
          if (['vite-hmr', 'vite-ping'].includes(req.headers['sec-websocket-protocol'])) {
            return;
          }

          const responseHeaders = ['HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade'];

          socket.write(`${ responseHeaders.join('\r\n') }\r\n\r\n`);
        });
      }

      checkRancherVersionCompatibility(api, shellRancherVersion);
    },

    configurePreviewServer(server) {
      server.middlewares.use(serverMiddlewares);
    },
  };
}
