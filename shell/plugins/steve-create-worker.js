import createWorker from './steve/worker/index.js';

/**
 * Link the steve worker creator to the store
 *
 * This is done to allow disassociate (no import chain) access to the steve worker file.
 * Without this third party plugins (in given scenarios / harvester) will fail to build
 * due to missing web worker specific build config
 *
 * Note - When rancher/steve store is spun out in to a extension this also needs to move out
 */
export default function({ store }) {
  store.steveCreateWorker = createWorker;
}
