import https from 'https';
import { parse as setCookieParser } from 'set-cookie-parser';
import pkg from '../package.json';

export default function({
  $axios, $cookies, isDev, req
}) {
  $axios.defaults.headers.common['Accept'] = 'application/json';
  $axios.defaults.xsrfCookieName = 'CSRF';
  $axios.defaults.xsrfHeaderName = 'X-Api-Csrf';
  $axios.defaults.withCredentials = true;

  if ( process.server ) {
    $axios.defaults.headers.common['user-agent'] = `Dashboard (Mozilla) v${ pkg.version }`;
    $axios.defaults.headers.common['access-control-expose-headers'] = `set-cookie`;

    // For requests from the server, set the base URL to the URL that the request came in on
    $axios.onRequest((config) => {
      if ( config.url.startsWith('/') ) {
        config.baseURL = `${ req.protocol || 'https' }://${ req.headers.host }`;
      }
    });

    $axios.onResponse((res) => {
      const parsed = setCookieParser(res.headers['set-cookie'] || []);

      for ( const opt of parsed ) {
        const key = opt.name;
        const value = opt.value;

        delete opt.name;
        delete opt.value;

        opt.encode = x => x;
        opt.sameSite = false;
        opt.path = '/';
        opt.secure = true;

        $cookies.set(key, value, opt);
      }
    });
  }

  if ( isDev ) {
    // https://github.com/nuxt-community/axios-module/blob/dev/lib/module.js#L78
    // forces localhost to http, for no obvious reason.
    // But we never have any reason to talk to anything plaintext.
    if ( $axios.defaults.baseURL.startsWith('http://') ) {
      $axios.defaults.baseURL = $axios.defaults.baseURL.replace(/^http:/, 'https:');
    }

    const insecureAgent = new https.Agent({ rejectUnauthorized: false });

    $axios.defaults.httpsAgent = insecureAgent;
    $axios.httpsAgent = insecureAgent;
  }
}
