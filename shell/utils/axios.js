import Axios from 'axios';
import defu from 'defu';
import axiosRetry from 'axios-retry';

// Axios.prototype cannot be modified
const axiosExtra = {
  setBaseURL(baseURL) {
    this.defaults.baseURL = baseURL;
  },
  setHeader(name, value, scopes = 'common') {
    for (const scope of Array.isArray(scopes) ? scopes : [scopes]) {
      if (!value) {
        delete this.defaults.headers[scope][name];

        return;
      }
      this.defaults.headers[scope][name] = value;
    }
  },
  setToken(token, type, scopes = 'common') {
    const value = !token ? null : (type ? `${ type } ` : '') + token;

    this.setHeader('Authorization', value, scopes);
  },
  onRequest(fn) {
    this.interceptors.request.use((config) => fn(config) || config);
  },
  onResponse(fn) {
    this.interceptors.response.use((response) => fn(response) || response);
  },
  onRequestError(fn) {
    this.interceptors.request.use(undefined, (error) => fn(error) || Promise.reject(error));
  },
  onResponseError(fn) {
    this.interceptors.response.use(undefined, (error) => fn(error) || Promise.reject(error));
  },
  onError(fn) {
    this.onRequestError(fn);
    this.onResponseError(fn);
  },
  create(options) {
    return createAxiosInstance(defu(options, this.defaults));
  }
};

// Request helpers ($get, $post, ...)
for (const method of ['request', 'delete', 'get', 'head', 'options', 'post', 'put', 'patch']) {
  axiosExtra[`$${ method }`] = function() {
    return this[method].apply(this, arguments).then((res) => res && res.data);
  };
}

const extendAxiosInstance = (axios) => {
  for (const key in axiosExtra) {
    axios[key] = axiosExtra[key].bind(axios);
  }
};

const createAxiosInstance = (axiosOptions) => {
  // Create new axios instance
  const axios = Axios.create(axiosOptions);

  axios.CancelToken = Axios.CancelToken;
  axios.isCancel = Axios.isCancel;

  // Extend axios proto
  extendAxiosInstance(axios);

  // Setup interceptors

  setupProgress(axios);
  axiosRetry(axios, { retries: 0 });

  return axios;
};

const setupProgress = (axios) => {
  // A noop loading inteterface for when $loading is not yet ready
  const noopLoading = {
    finish: () => { },
    start:  () => { },
    fail:   () => { },
    set:    () => { }
  };

  const $loading = () => {
    const $globalApp = window.$globalApp;

    return ($globalApp && $globalApp.$loading && $globalApp.$loading.set) ? $globalApp.$loading : noopLoading;
  };

  let currentRequests = 0;

  axios.onRequest((config) => {
    if (config && config.progress === false) {
      return;
    }

    currentRequests++;
  });

  axios.onResponse((response) => {
    if (response && response.config && response.config.progress === false) {
      return;
    }

    currentRequests--;
    if (currentRequests <= 0) {
      currentRequests = 0;
      $loading().finish();
    }
  });

  axios.onError((error) => {
    if (error && error.config && error.config.progress === false) {
      return;
    }

    currentRequests--;

    if (Axios.isCancel(error)) {
      return;
    }

    $loading().fail();
    $loading().finish();
  });

  const onProgress = (e) => {
    if (!currentRequests) {
      return;
    }
    const progress = ((e.loaded * 100) / (e.total * currentRequests));

    $loading().set(Math.min(100, progress));
  };

  axios.defaults.onUploadProgress = onProgress;
  axios.defaults.onDownloadProgress = onProgress;
};

export default (ctx, inject) => {
  // runtimeConfig
  const runtimeConfig = (ctx.$config && ctx.$config.axios) || {};
  // baseURL
  const baseURL = process.browser ? (runtimeConfig.browserBaseURL || runtimeConfig.baseURL || '/') : (runtimeConfig.baseURL || process.env._AXIOS_BASE_URL_ || 'https://localhost:8005/');

  // Create fresh objects for all default header scopes
  // Axios creates only one which is shared across SSR requests!
  // https://github.com/mzabriskie/axios/blob/master/lib/defaults.js
  const headers = {
    common: { Accept: 'application/json, text/plain, */*' },
    delete: {},
    get:    {},
    head:   {},
    post:   {},
    put:    {},
    patch:  {}
  };

  const axiosOptions = {
    baseURL,
    headers
  };

  const axios = createAxiosInstance(axiosOptions);

  // Inject axios to the context as $axios
  ctx.$axios = axios;
  inject('axios', axios);
};
