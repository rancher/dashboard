const fs = require('fs');
const https = require('https');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

const base = path.resolve(__dirname, '.');
const dist = path.resolve(base, 'ui');

const options = {
  key:  fs.readFileSync(path.resolve(base, 'cert/server.key')),
  cert: fs.readFileSync(path.resolve(base, 'cert/server.crt'))
};

let api = process.env.API || 'http://localhost:8989';

if ( !api.startsWith('http') ) {
  api = `https://${ api }`;
}

let PORT = process.env.PORT || '5443';

PORT = parseInt(PORT, 10);

if (isNaN(PORT)) {
  console.log('Invalid port'); // eslint-disable-line no-console
  process.exit(1);
}

const dev = (process.env.NODE_ENV !== 'production');
const devPorts = dev || process.env.DEV_PORTS === 'true';

const proxy = {
  '/k8s':          proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
  '/pp':           proxyWsOpts(api), // For (epinio) standalone API
  '/api':          proxyWsOpts(api), // Management k8s API
  '/apis':         proxyWsOpts(api), // Management k8s API
  '/v1':           proxyWsOpts(api), // Management Steve API
  '/v3':           proxyWsOpts(api), // Rancher API
  '/v3-public':    proxyOpts(api), // Rancher Unauthed API
  '/api-ui':       proxyOpts(api), // Browser API UI
  '/meta':         proxyMetaOpts(api), // Browser API UI
  '/v1-*':         proxyOpts(api), // SAML, KDM, etc
  // These are for Ember embedding
  '/c/*/edit':     proxyOpts('https://127.0.0.1:8000'), // Can't proxy all of /c because that's used by Vue too
  '/k/':           proxyOpts('https://127.0.0.1:8000'),
  '/g/':           proxyOpts('https://127.0.0.1:8000'),
  '/n/':           proxyOpts('https://127.0.0.1:8000'),
  '/p/':           proxyOpts('https://127.0.0.1:8000'),
  '/assets':       proxyOpts('https://127.0.0.1:8000'),
  '/translations': proxyOpts('https://127.0.0.1:8000'),
  '/engines-dist': proxyOpts('https://127.0.0.1:8000'),
  // Plugin dev
  '/verdaccio/':   proxyOpts('http://127.0.0.1:4873/-'),
};

const proxies = {};

const app = express();

for (const [key, value] of Object.entries(proxy)) {
  const config = createProxyMiddleware(value);

  proxies[key] = config;
  app.use(key, config);
}

app.use(express.static(dist));

// Catch reload on a dynamic page
// Check that the requestor will accept html and send them the index file
app.use('*', (req, res, next) => {
  const accept = req.headers.accept || '';
  const acceptArray = accept.split(',');
  const html = acceptArray.find(h => h.trim() === 'text/html');

  if (html) {
    return res.sendFile(path.join(dist, 'index.html'));
  }

  next();
});

const server = https.createServer(options, app);
const appServer = server.listen(PORT);

console.log(`Running Dashboard web server on port ${ PORT }`); // eslint-disable-line no-console

// Just proxy web sockets for v1 and v3 endpoints
appServer.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/v1')) {
    return proxies['/v1'].upgrade(req, socket, head);
  } else if (req.url.startsWith('/v3')) {
    return proxies['/v3'].upgrade(req, socket, head);
  } else if (req.url.startsWith('/k8s/')) {
    return proxies['/k8s'].upgrade(req, socket, head);
  } else {
    console.log(`Unknown Web socket upgrade request for ${ req.url }`); // eslint-disable-line no-console
  }
});

// ===============================================================================================
// Functions for the request proxying used in dev
// ===============================================================================================

function proxyMetaOpts(target) {
  return {
    target,
    followRedirects: true,
    secure:          !dev,
    ws:              false,
    changeOrigin:    true,
    onProxyReq,
    onProxyReqWs,
    onError,
    onProxyRes,
  };
}

function proxyOpts(target) {
  return {
    target,
    secure:       !devPorts,
    ws:           false,
    changeOrigin: true,
    onProxyReq,
    onProxyReqWs,
    onError,
    onProxyRes,
  };
}

function onProxyRes(proxyRes, req, res) {
  if (devPorts) {
    proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
  }
}

function proxyWsOpts(target) {
  return {
    ...proxyOpts(target),
    ws:           false,
    changeOrigin: true,
    secure:       false,
  };
}

function onProxyReq(proxyReq, req) {
  if (!(proxyReq._currentRequest && proxyReq._currentRequest._headerSent)) {
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');
    // console.log(proxyReq.getHeaders());
  }
}

function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', `${ options.target.href }/`);
  proxyReq.setHeader('x-api-host', req.headers['host']);
  proxyReq.setHeader('x-forwarded-proto', 'https');

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err); // eslint-disable-line no-console
  });
}

function onError(err, req, res) {
  res.statusCode = 598;
  console.error('Proxy Error:', err); // eslint-disable-line no-console
  res.write(JSON.stringify(err));
}
