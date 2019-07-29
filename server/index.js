require('dotenv').config();
const path = require('path');
const http = require('http');
const https = require('https');
const consola = require('consola');
const express = require('express');
const HttpProxy = require('http-proxy');
const { Nuxt, Builder } = require('nuxt');
const app = express();

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js');
const { ProxyError } = require('./error');

config.dev = !(process.env.NODE_ENV === 'production');

if (config.dev) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

start();

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config);

  const { host, port } = nuxt.options.server || 'localhost';

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt);

    await builder.build();
  } else {
    await nuxt.ready();
  }

  let httpServer;

  if (config.server.https) {
    httpServer = https.createServer({
      cert: config.server.https.cert,
      key:  config.server.https.key
    }, app);
  } else {
    httpServer = http.createServer(app);
  }

  const proxyTo = normalizeHost(config.server.api);
  const serverProxy = HttpProxy.createProxyServer({
    ws:     true,
    xfwd:   true,
    target: proxyTo,
    secure: false,
  });

  httpServer.on('upgrade', handleUpgrade.bind(this, serverProxy));
  httpServer.listen(config.server.port, config.server.host);

  serverProxy.on('error', onProxyError);
  consola.info('Proxying API to', proxyTo);

  Object.keys(config.server.proxy).forEach((label) => {
    const base = config.server.proxy[label];

    consola.log(`Registering ${ base }`);
    app.use(base, (req, res /* , next */) => {
      if (req.url === '/') {
        req.url = '';
      }

      // include root path in proxied request
      req.url = path.join(base, req.url);
      req.headers['X-Forwarded-Proto'] = req.protocol;

      // don't include the original host header
      req.headers['X-Forwarded-Host'] = req.headers['host'];
      delete req.headers['host'];

      if (config.server.apiToken) {
        req.headers['Authorization'] = `Basic ${ Buffer.from(config.server.apiToken).toString('base64') }`;
      }

      proxyLog(label, req);
      serverProxy.web(req, res);
    });
  });

  // Give nuxt middleware to express
  app.use(nuxt.render);

  consola.ready({
    message: `Server listening on http${ config.server.https ? 's' : '' }://${ (host === '0.0.0.0' ? 'localhost' : host) }:${ port }`,
    badge:   true
  });
}

function handleUpgrade(proxy, req, socket, head) {
  if (req.url.startsWith('/_lr/')) {
    return;
  }

  // don't include the original host header
  const targetHost = config.server.api.replace(/^https?:\/\//, '');
  let host = req.headers['host'];
  let port;

  if (socket.ssl) {
    req.headers['x-forwarded-proto'] = 'https';
    port = 443;
  } else {
    req.headers['x-forwarded-proto'] = 'http';
    port = 80;
  }

  if (host) {
    const idx = host.lastIndexOf(':');

    if (((host.startsWith('[') && host.includes(']:')) || !host.startsWith('[')) && idx > 0) {
      port = host.substr(idx + 1);
      host = host.substr(0, host.lastIndexOf(':'));
    }
  }

  req.headers['x-forwarded-host'] = host;
  req.headers['x-forwarded-port'] = port;
  req.headers['host'] = targetHost;
  req.headers['origin'] = config.server.api;
  req.socket.servername = targetHost;

  proxyLog('WS', req);
  try {
    proxy.ws(req, socket, head);
  } catch (err) {
    proxyError('WS', req, err);
  }
}

function onProxyError(err, req, res) {
  consola.error(`Proxy Error on ${ req.method } to ${ req.url }`, err);

  if (req.upgrade) {
    res.end();

    return;
  }

  const error = new ProxyError({ detail: err.toString() });

  error.respond(req, res);
}

function proxyLog(label, req) {
  consola.log(`[${ label }][${ req.isServer }]`, req.method, req.url);
}

function proxyError(label, req, err) {
  consola.error(`[${ label }][${ req.isServer }]`, req.method, req.url, err);
}

// host can be an ip "1.2.3.4" -> https://1.2.3.4:30443
// or a URL+port
function normalizeHost(host, defaultPort) {
  if (host.indexOf('http') === 0) {
    return host;
  }

  if (host.indexOf(':') >= 0 || defaultPort === 443) {
    host = `https://${ host }`;
  } else {
    host = `https://${ host }${ defaultPort ? `:${ defaultPort }` : '' }`;
  }

  return host;
}
