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
      res.removeHeader('transfer-encoding');
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

const requestHost = (req) => req.headers['host'] || req.headers[':authority'];

function onProxyReq(proxyReq, req) {
  if (!(proxyReq._currentRequest && proxyReq._currentRequest._headerSent)) {
    proxyReq.setHeader('x-api-host', requestHost(req));
    proxyReq.setHeader('x-forwarded-proto', 'https');
  }
}

function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);
  proxyReq.setHeader('x-api-host', requestHost(req));
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());
}

function onError(err, req, res) {
  res.statusCode = 598;
  res.end(JSON.stringify(err));
}

const PROXY_EVENTS = {
  onProxyReq:   'proxyReq',
  onProxyReqWs: 'proxyReqWs',
  onProxyRes:   'proxyRes',
  onError:      'error',
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Convert proxies keyed by path, with http-proxy-middleware style handlers (`onProxyReq`, `onProxyRes`, ...), into
 * vite's `server.proxy`. A path proxies itself and everything below it; a path ending in `*` proxies everything that
 * starts with the rest of it.
 *
 * @param {Record<string, object>} proxies
 * @returns {Record<string, object>} vite proxy options keyed by a regular expression for the path
 */
function toViteProxy(proxies = {}) {
  return Object.entries(proxies).reduce((out, [path, options]) => {
    const { configure, ...rest } = options;
    const handlers = {};

    Object.entries(PROXY_EVENTS).forEach(([option, event]) => {
      if (rest[option]) {
        handlers[event] = rest[option];
        delete rest[option];
      }
    });

    const context = path.endsWith('*') ? `^${ escapeRegExp(path.slice(0, -1)) }` : `^${ escapeRegExp(path) }(?=[/?#]|$)`;

    out[context] = {
      ...rest,
      configure(proxy, proxyOptions) {
        Object.entries(handlers).forEach(([event, handler]) => proxy.on(event, handler));
        configure?.(proxy, proxyOptions);
      },
    };

    return out;
  }, {});
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
  onError,
  toViteProxy
};
