// Web workers loaded using Vite's ?worker suffix
import BasicWorker from '@shell/plugins/steve/worker/web-worker.basic.js?worker';
import AdvancedWorker from '@shell/plugins/steve/worker/web-worker.advanced.js?worker';

export const WORKER_MODES = {
  WAITING:      'waiting',
  DESTROY_MOCK: 'destroy',
  BASIC:        'basic',
  ADVANCED:     'advanced'
};

export default function storeWorker(mode, options = {}, closures = {}) {
  let worker;

  if (mode === WORKER_MODES.ADVANCED) {
    worker = new AdvancedWorker();
  } else {
    worker = new BasicWorker();
  }
  worker.mode = mode;

  return worker;
}
