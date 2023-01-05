// eslint-disable-next-line no-unused-vars
import basicWorkerConstructor from '@shell/plugins/steve/worker/web-worker.basic.js';
// eslint-disable-next-line no-unused-vars
import advancedWorkerConstructor from '@shell/plugins/steve/worker/web-worker.advanced.js';

export default function storeWorker(mode, options = {}, closures = {}) {
  let worker;

  if (mode === 'advanced') {
    worker = new advancedWorkerConstructor();
  } else {
    worker = new basicWorkerConstructor();
  }
  worker.mode = mode;

  return worker;
}
