import https from 'https';

export default function({ $axios, isDev }) {
  $axios.defaults.headers.common['Accept'] = 'application/json';

  if ( isDev ) {
    // https://github.com/nuxt-community/axios-module/blob/dev/lib/module.js#L78
    // forces localhost to http, for no obvious reason.
    if ( $axios.defaults.baseURL.startsWith('http://') ) {
      $axios.defaults.baseURL = $axios.defaults.baseURL.replace(/^http:/, 'https:');
    }

    const insecureAgent = new https.Agent({ rejectUnauthorized: false });

    $axios.onRequest((config) => {
      config.httpsAgent = insecureAgent;
    });
  }
}
