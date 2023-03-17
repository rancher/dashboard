// eslint-disable-next-line no-unused-vars
import basicWorkerConstructor from '@shell/plugins/steve/worker/web-worker.basic.js';
// eslint-disable-next-line no-unused-vars
import advancedWorkerConstructor from '@shell/plugins/steve/worker/web-worker.advanced.js';
import { CSRF } from '@shell/config/cookies';
import { deferred } from '@shell/utils/promise';

export default function steveCreateWorker(ctx, mode) {
  let worker;
  const deferredRequests = {};

  /**
   * Ensure any duplicated requests receive the result of the initial request
   */
  const finishDeferred = (requestHash, action = 'resolve', res) => {
    const waiting = deferredRequests[requestHash] || [];

    // console.log('Resolving deferred for', requestHash, waiting.length);

    while ( waiting.length ) {
      waiting.pop()[action](res);
    }

    delete deferredRequests[requestHash];
  };

  /**
   * Make a http request, create a cached promise and return the promise.
   *
   * The returned promise will be resolved once we receive notification of a result from the worker thread
   */
  const postMessageAndWait = function(params) {
    // The rough chain of events are..
    // 1) `postMessageAndWait`
    // - This creates a promise with a hash to identify the request
    // - Sends message `waitingForResponse` to the worker thread
    // - Returns the promise
    // ------ ui / worker thread divide ------
    // 2) Worker thread action handles `waitingForResponse` and passes on to another worker thread action `request`
    // - This passes in a callback that is executed once the API request is completed
    // 3) Worker thread action handles `request` and calls `state.api.request`
    // - state.api is a ResourceRequest instance
    // 4) ResourceRequest `request` makes http request and triggers callback
    // - callback sends message `awaitedResponse` to UI thread
    // ------ ui / worker thread divide ------
    // 5) Subscribe instance handles `awaitedResponse`
    // - This locates the promise from above and resolves it

    const {
      type, id, namespace, selector, limit, filter, sortBy, sortOrder, force
    } = params;

    try {
      const requestParams = JSON.parse(JSON.stringify({
        type,
        id,
        namespace,
        selector,
        limit,
        filter,
        sortBy,
        sortOrder,
        force
      }));
      const requestHash = JSON.stringify(requestParams);

      // If we're already making this request return a weak link to the result of the first request
      if (worker.requests[requestHash]) {
        if (!deferredRequests[requestHash]) {
          deferredRequests[requestHash] = [];
        }

        const later = deferred();

        deferredRequests[requestHash].push(later);

        return later.promise;
      }

      worker.requests[requestHash] = {
        resolves: undefined, reject: undefined, promise: undefined
      };

      // These are tidied up when there's a response over at `awaitedResponse`
      worker.requests[requestHash].promise = new Promise((resolve, reject) => {
        worker.requests[requestHash].resolves = (resources) => {
          resolve(resources);
          finishDeferred(requestHash, 'resolve', resources);
        };
        worker.requests[requestHash].reject = (error) => {
          reject(error);
          finishDeferred(requestHash, 'reject', error);
        };

        worker.postMessage({
          waitingForResponse: {
            requestHash,
            params: requestParams
          }
        });
      });

      return worker.requests[requestHash].promise;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  if (mode === 'advanced') {
    worker = new advancedWorkerConstructor();
    worker.requests = {};
    worker.postMessageAndWait = postMessageAndWait;

    worker.postMessage({
      initWorker: {
        url:       `${ ctx.state.config.baseUrl }`,
        csrf:      this.$cookies.get(CSRF, { parseJSON: false }), // steveCreateWorker is in the root store
        config:    ctx.state.config,
        storeName: ctx.getters.storeName
      },
    });
  } else {
    worker = new basicWorkerConstructor();
    worker.postMessage({ initWorker: { storeName: ctx.getters.storeName } });
  }
  worker.mode = mode;

  return worker;
}
