const path = require('path');
const fs = require('fs');

/**
 * Adds custom server middleware to the Vite dev server.
 *
 * Handles:
 * - verify-auth redirect middleware (from shell/server/server-middleware.js)
 * - HAR file proxy support (from shell/server/har-file.js) when HAR_FILE env is set
 */
function serverMiddlewarePlugin(shellDir) {
  return {
    name: 'rancher-server-middleware',

    configureServer(server) {
      // Add the verify-auth redirect middleware
      const middlewarePath = path.join(shellDir, 'server', 'server-middleware.js');

      if (fs.existsSync(middlewarePath)) {
        const serverMiddleware = require(middlewarePath);

        server.middlewares.use(serverMiddleware);
      }

      // Add HAR file proxy middleware if configured
      const harFile = process.env.HAR_FILE;

      if (harFile) {
        const harPath = path.join(shellDir, 'server', 'har-file.js');

        if (fs.existsSync(harPath)) {
          const devPorts = process.env.NODE_ENV !== 'production' || process.env.DEV_PORTS === 'true';
          const har = require(harPath);
          const harData = har.loadFile(harFile, devPorts ? 8005 : 80, '');

          if (harData) {
            console.log('Installing HAR file middleware'); // eslint-disable-line no-console
            server.middlewares.use(har.harProxy(harData, process.env.HAR_DIR));
          }
        }
      }
    },
  };
}

module.exports = { serverMiddlewarePlugin };
