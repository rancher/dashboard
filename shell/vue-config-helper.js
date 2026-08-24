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
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');
  }
}

function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);
  proxyReq.setHeader('x-api-host', req.headers['host']);
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err); // eslint-disable-line no-console
  });
}

function onError(err, req, res) {
  console.error('Proxy Error:', err); // eslint-disable-line no-console

  // Websocket upgrades don't have a normal `res` — bail out so http-proxy-middleware handles it.
  if (!res || typeof res.writeHead !== 'function') {
    return;
  }

  // Guard against writing to a response that already started (or a socket that's gone away).
  if (res.headersSent || res.writableEnded) {
    return;
  }

  // Serialize the error with its own properties (a bare `JSON.stringify(err)` on an Error yields "{}").
  const body = JSON.stringify({
    code:    err?.code,
    errno:   err?.errno,
    syscall: err?.syscall,
    address: err?.address,
    port:    err?.port,
    message: err?.message || String(err),
  });

  // IMPORTANT: we must `end()` the response. Without it the browser sees the request as pending
  // forever, so any code awaiting it (including console logging in `.catch()` blocks) never runs
  // until the dev server is stopped and the socket drops. See rancher/dashboard#11591.
  res.writeHead(504, { 'content-type': 'application/json' });
  res.end(body);
}

module.exports = {
  dev,
  devPorts,
  prime,
  api,
  proxyMetaOpts,
  proxyOpts,
  proxyPrimeOpts,
  onProxyRes,
  proxyWsOpts,
  onProxyReq,
  onProxyReqWs,
  onError
};
