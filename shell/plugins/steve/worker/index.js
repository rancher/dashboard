// eslint-disable-next-line
import basicWorkerConstructor from '@shell/plugins/steve/worker/web-worker.basic.js';
// eslint-disable-next-line
import advancedWorkerConstructor from '@shell/plugins/steve/worker/web-worker.advanced.js';
import { quickHashObj } from '@shell/utils/crypto';

export default function storeWorker(mode, options = {}) {
  const { storeName, dispatch } = options;
  let worker;

  if (mode === 'advanced') {
    worker = new advancedWorkerConstructor();
  } else if (mode === 'basic') {
    worker = new basicWorkerConstructor();
  }

  worker.mode = mode;
  worker.ready = true;
  worker.store = storeName;
  worker.requests = {};
  worker.postMessageAndWait = function(msg) {
    const payload = {
      type: msg.type,
      opt:  msg.opt
    };
    const messageHash = quickHashObj(payload);

    if (worker.requests[messageHash]) {
      return new Error('duplicate request is already active'); // eslint-disable-line no-console
    }

    worker.requests[messageHash] = {
      resolves: undefined, reject: undefined, promise: undefined
    };

    worker.requests[messageHash].promise = new Promise((resolve, reject) => {
      worker.requests[messageHash].resolves = resolve;
      worker.requests[messageHash].reject = reject;

      worker.postMessage({
        waitingForResponse: {
          messageHash,
          msg: payload
        }
      });
    });

    return worker.requests[messageHash].promise;
  };
  worker.messageHandlers = {
    awaitedResponse: ({ messageHash, ...payload }) => {
      dispatch('batchChanges', { ...payload });
      worker.requests[messageHash].resolves(payload);
      delete worker.requests[messageHash];
    },
    batchChanges:     (batch) => {
      dispatch('batchChanges', { ...batch });
    },
  };

  worker.onmessage = (e) => {
    const messageActions = Object.keys(e?.data);

    messageActions.forEach((action) => {
      const handler = worker.messageHandlers[action] || (actionPayload => console.warn(`no handler for action: ${ action }`, actionPayload)); // eslint-disable-line no-console

      handler(e?.data[action]);
    });
  };

  return worker;
}
