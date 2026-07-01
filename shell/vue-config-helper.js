const dev = (process.env.NODE_ENV !== 'production');
const devPorts = dev || process.env.DEV_PORTS === 'true';
const prime = process.env.PRIME;

let api = process.env.API || 'http://localhost:8989';

if ( !api.startsWith('http') ) {
  api = `https://${ api }`;
}

// ===============================================================================================
// Functions for the request proxying used in dev
// ===============================================================================================

function proxyMetaOpts(target) {
  return {
    target,
    followRedirects: true,
    secure:          !dev,
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
    changeOrigin: true,
    onProxyReq,
    onProxyReqWs,
    onError,
    onProxyRes
  };
}

// Intercept the /rancherversion API call wnad modify the 'RancherPrime' value
// if configured to do so by the environment variable PRIME
function proxyPrimeOpts(target) {
  const opts = proxyOpts(target);

  // Don't intercept if the PRIME environment variable is not set
  if (!prime?.length) {
    return opts;
  }

  opts.onProxyRes = (proxyRes, req, res) => {
    const _end = res.end;
    let body = '';

    proxyRes.on( 'data', (data) => {
      data = data.toString('utf-8');
      body += data;
    });

    res.write = () => {};

    res.end = () => {
      let output = body;

      try {
        const out = JSON.parse(body);

        out.RancherPrime = prime;
        output = JSON.stringify(out);
      } catch (err) {}

      res.setHeader('content-length', output.length );
      res.setHeader('content-type', 'application/json' );
      res.setHeader('transfer-encoding', '');
      res.setHeader('cache-control', 'no-cache');
      res.writeHead(proxyRes.statusCode);
      _end.apply(res, [output]);
    };
  };

  return opts;
}

function onProxyRes(proxyRes, req, res) {
  if (devPorts) {
    proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
  }
}

function proxyWsOpts(target) {
  return {
    ...proxyOpts(target),
    ws:           true,
    changeOrigin: true,
  };
}

function onProxyReq(proxyReq, req) {
  if (!(proxyReq._currentRequest && proxyReq._currentRequest._headerSent)) {
    // With HTTP/2 (vite dev server) the host header is replaced by :authority
    const host = req.headers['host'] || req.headers[':authority'];

    if (host) {
      proxyReq.setHeader('x-api-host', host);
    }
    proxyReq.setHeader('x-forwarded-proto', 'https');
  }
}

function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);

  const host = req.headers['host'] || req.headers[':authority'];

  if (host) {
    proxyReq.setHeader('x-api-host', host);
  }
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err); // eslint-disable-line no-console
  });
}

function onError(err, req, res) {
  res.statusCode = 598;
  console.error('Proxy Error:', err); // eslint-disable-line no-console
  res.write(JSON.stringify(err));
}

// Standard set of dev-server proxies to the Rancher API, shared by the webpack
// and vite dev servers
function getStandardProxies(target = api) {
  return {
    '/k8s':            proxyWsOpts(target), // Straight to a remote cluster (/k8s/clusters/<id>/)
    '/pp':             proxyWsOpts(target), // For (epinio) standalone API
    '/api':            proxyWsOpts(target), // Management k8s API
    '/apis':           proxyWsOpts(target), // Management k8s API
    '/v1':             proxyWsOpts(target), // Management Steve API
    '/v3':             proxyWsOpts(target), // Rancher API
    '/v3-public':      proxyOpts(target), // Rancher Unauthed API
    '/api-ui':         proxyOpts(target), // Browser API UI
    '/meta':           proxyMetaOpts(target), // Browser API UI
    '/v1-*':           proxyOpts(target), // SAML, KDM, etc
    '/rancherversion': proxyPrimeOpts(target), // Rancher version endpoint
    '/version':        proxyPrimeOpts(target), // Rancher Kube version endpoint
  };
}

module.exports = {
  dev,
  devPorts,
  prime,
  api,
  getStandardProxies,
  proxyMetaOpts,
  proxyOpts,
  proxyPrimeOpts,
  onProxyRes,
  proxyWsOpts,
  onProxyReq,
  onProxyReqWs,
  onError
};
