import https from 'https';
import { CSRF } from '@shell/config/cookies';
import { parse as setCookieParser } from 'set-cookie-parser';
import pkg from '../package.json';

export default function({
  $axios, $cookies, isDev, req
}) {
  $axios.defaults.headers.common['Accept'] = 'application/json';
  $axios.defaults.withCredentials = true;

  $axios.onRequest((config) => {
    const csrf = $cookies.get(CSRF, { parseJSON: false });

    if ( csrf ) {
      config.headers['x-api-csrf'] = csrf;
    }

    if ( process.server ) {
      config.headers.common['access-control-expose-headers'] = `set-cookie`;
      config.headers.common['user-agent'] = `Dashboard (Mozilla) v${ pkg.version }`;

      if ( req.headers.cookie ) {
        config.headers.common['cookies'] = req.headers.cookie;
      }

      if ( config.url.startsWith('/') ) {
        config.baseURL = `${ req.protocol || 'https' }://${ req.headers.host }`;
      }
    }
  });

  if ( process.server ) {
    $axios.onResponse((res) => {
      const parsed = setCookieParser(res.headers['set-cookie'] || []);

      for ( const opt of parsed ) {
        const key = opt.name;
        const value = opt.value;

        delete opt.name;
        delete opt.value;

        opt.encode = x => x;
        opt.sameSite = true;
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
