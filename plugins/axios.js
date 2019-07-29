import https from 'https';

export default function({ $axios }) {
  $axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
}
