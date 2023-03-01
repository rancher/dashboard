// eslint-disable-next-line no-unused-vars
import basicWorkerConstructor from '@shell/plugins/steve/worker/web-worker.basic.js';
// eslint-disable-next-line no-unused-vars
import advancedWorkerConstructor from '@shell/plugins/steve/worker/web-worker.advanced.js';

export default function storeWorker(mode, options = {}, closures = {}) {
  let worker;

  if (mode === 'advanced') {
    worker = new advancedWorkerConstructor();
    worker.requests = {};
    worker.postMessageAndWait = function(params) {
      const {
        type, id, namespace, selector, limit, filter, sortBy, sortOrder
      } = params;
      const requestParams = JSON.parse(JSON.stringify({
        type,
        id,
        namespace,
        selector,
        limit,
        filter,
        sortBy,
        sortOrder
      }));
      const requestHash = JSON.stringify(requestParams);

      if (worker.requests[requestHash]) {
        return new Error('duplicate request is already active');
      }

      worker.requests[requestHash] = {
        resolves: undefined, reject: undefined, promise: undefined
      };

      worker.requests[requestHash].promise = new Promise((resolve, reject) => {
        worker.requests[requestHash].resolves = (resources) => {
          resolve(resources);
        };
        worker.requests[requestHash].reject = reject;

        worker.postMessage({
          waitingForResponse: {
            requestHash,
            params: requestParams
          }
        });
      });

      return worker.requests[requestHash].promise;
    };
  } else {
    worker = new basicWorkerConstructor();
  }
  worker.mode = mode;

  return worker;
}
