/* eslint-disable no-console */
const https = require('https');
const axios = require('axios');

const DEFAULT_PASSWORD = 'password';
const DEFAULT_BASE_URL = 'https://localhost';

const options = { httpsAgent: new https.Agent({ rejectUnauthorized: false }) };

/**
 * Handle errors by printing errors and exit from the process
 */
const handleError = (error) => {
  console.error(error.message, error.name);
  console.error(error.status || error.response?.status || '', error.code || error.response?.statusText || '');
  process.exit(1);
};

/**
 * Initial GET request to retrieve CSRF token
 * @returns
 */
const getToken = () => {
  console.info('ℹ Get certificate');
  const url = `/v3-public/authProviders`;

  // Enforce request
  axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  axios.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  // Set response cookies
  axios.defaults.headers.common['access-control-expose-headers'] = `set-cookie`;
  axios.defaults.headers.common['user-agent'] = `Dashboard (Mozilla) v${ process.env.version }`;

  return axios.get(url, options)
    .then((response) => {
      const cookies = response.headers['set-cookie'][0].split(';');
      const csrf = cookies[0];
      const csrfValue = csrf.match(new RegExp(`(^| )CSRF=([^;]+)`))[2];

      return csrfValue;
    })
    .catch(handleError);
};

const setBootstrapPassword = () => {
  console.info('ℹ Init Docker with bootstrap password');
  const password = process.env.CATTLE_BOOTSTRAP_PASSWORD || DEFAULT_PASSWORD;
  const url = `/v3-public/localProviders/local?action=login`;
  const body = {
    description:  'UI session',
    password,
    responseType: 'cookie',
    username:     'admin'
  };

  return axios.post(url, body, options)
    .then(({ status, statusText }) => {
      console.debug(status, statusText);
      console.info('✔ Bootstrap password set');
    })
    .catch(handleError);
};

/**
 * Set initial password for the admin
 * @returns
 */
const setUserPassword = (csrf) => {
  console.info('ℹ Init Docker with Local Auth admin credentials');
  const newPassword = process.env.TEST_PASSWORD || DEFAULT_PASSWORD;
  const url = `/v3/users?action=changepassword`;
  const body = {
    currentPassword: process.env.TEST_PASSWORD,
    newPassword
  };

  return axios.post(url, body, options)
    .then(({ status, statusText }) => {
      console.debug(status, statusText);
      console.info('✔ Admin password set');
    })
    .catch(handleError);
};

const init = async() => {
  axios.defaults.withCredentials = true;
  axios.defaults.headers.common['Accept'] = 'application/json';
  axios.defaults.baseURL = process.env.API || DEFAULT_BASE_URL;

  const csrf = await getToken();

  // Append initial token to the header
  axios.defaults.headers.common['x-api-csrf'] = csrf;

  const bootstrapPassword = await setBootstrapPassword();
  const adminPassword = await setUserPassword();

  if (bootstrapPassword && adminPassword) {
    console.info('✔ Rancher initialized');
  }
};

init();
