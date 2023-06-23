import { SCHEMA } from '@shell/config/types';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { removeSchemaIndexFields } from '@shell/plugins/steve/schema.utils';

const SCHEMA_FLUSH_TIMEOUT = 2500;

const state = {
  store:      '', // Store name
  flushTimer: undefined, // Timer to flush the schema change queue
  queue:      [], // Schema change queue
  schemas:    {} // Map of schema id to hash to track when a schema actually changes
};

function flush() {
  state.queue.forEach((schema) => {
    const hash = hashObj(schema);
    const existing = state.schemas[schema.id];

    if (!existing || (existing && existing !== hash)) {
      // console.log(`${ schema.id } CHANGED  ${ hash } > ${ existing }`);
      state.schemas[schema.id] = hash;

      const msg = {
        data:         schema,
        resourceType: SCHEMA,
        type:         'resource.change'
      };

      load(msg);
    }
  });

  state.queue = [];

  state.flushTimer = setTimeout(flush, SCHEMA_FLUSH_TIMEOUT);
}

state.flushTimer = setTimeout(flush, SCHEMA_FLUSH_TIMEOUT);

// Callback to the store's load function (in the main thread) to process a load
function load(data) {
  self.postMessage({ load: data });
}

// used for dispatching a function in the worker, primarily for redirecting messages intended for the advanced worker back to the UI thread
function redispatch(msg) {
  self.postMessage({ redispatch: msg });
}

/**
 * These actions aren't applicable to the basic worker, so bounce back to ui thread
 *
 * These are called when a queue of actions is flushed. Queue is populated from requests made before we know if worker is basic or advanced.
 */
const advancedWorkerActions = {
  watch: (msg) => {
    redispatch({ send: msg });
  },
  createWatcher: (msg) => {
    redispatch({ subscribe: msg });
  }
};

const workerActions = {
  onmessage: (e) => {
    /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
    // good enough for now considering that we never send more than one message action at a time right now */
    const messageActions = Object.keys(e?.data);

    messageActions.forEach((action) => {
      if (workerActions[action]) {
        workerActions[action](e?.data[action]);
      } else {
        console.warn('no associated action for:', action); // eslint-disable-line no-console
      }
    });
  },
  initWorker: ({ storeName }) => {
    state.store = storeName;
  },

  destroyWorker: () => {
    clearTimeout(state.flushTimer);

    self.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.
  },

  // Called to load schema
  loadSchemas: (schemas) => {
    schemas.forEach((schema) => {
      // These properties are added to the object, but aren't on the raw object, so remove them
      // otherwise our comparison will show changes when there aren't any
      removeSchemaIndexFields(schema);

      state.schemas[schema.id] = hashObj(schema);
    });
  },

  // Called when schema is updated
  updateSchema: (schema) => {
    // Add the schema to the queue to be checked to see if the schema really changed
    state.queue.push(schema);
  },

  // Remove the cached schema
  removeSchema: (id) => {
    // Remove anything in the queue related to the schema - we don't want to send any pending updates later for a schema that has been removed
    state.queue = state.queue.filter((schema) => schema.id !== id);

    // Delete the schema from the map, so if it comes back we don't ignore it if the hash is the same
    delete state.schemas[id];
  },
  ...advancedWorkerActions
};

self.onmessage = workerActions.onmessage; // bind everything to the worker's onmessage handler via the workerAction
