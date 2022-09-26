import { SCHEMA } from '@shell/config/types';

const COUNT_FLUSH_TIMEOUT = 5000;
const SCHEMA_FLUSH_TIMEOUT = 2500;

const state = {
  id:         Math.trunc(Math.random() * 1000000),
  store:      '', // Store name
  count:      [], // Buffer of count resources recieved in a given window
  countTimer: undefined, // Tiemr to flush the count buffer
  flushTimer: undefined, // Timer to flush the schema chaneg queue
  queue:      [], // Schema change queue
  schema:     {} // Map of schema id to hash to track when a schema actually changes
};

// Quick, simple hash function
function hash(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);

    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return new Uint32Array([hash])[0].toString(36);
}

// Quick, simple hash function to generate hash for an object
function hashObj(obj) {
  return hash(JSON.stringify(obj, null, 2));
}

function flush() {
  state.queue.forEach((schema) => {
    const hash = hashObj(schema);
    const existing = state.schema[schema.id];

    if (!existing || (existing && existing !== hash)) {
      // console.log(`${ schema.id } CHANGED  ${ hash } > ${ existing }`);
      state.schema[schema.id] = hash;

      const msg = {
        data:          schema,
        resourceType:  SCHEMA,
        type:          'resource.change'
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

const workerActions = {
  onmessage: (e) => {
    /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
    // good enough for now considering that we never send more than one message action at a time right now */
    const messageActions = Object.keys(e?.data);

    messageActions.forEach((action) => {
      if (workerActions[action]) {
        workerActions[action](e?.data[action]);
      } else {
        console.warn('no associated action for:', action, e); // eslint-disable-line no-console
      }
    });
  },
  initWorker: ({ storeName }) => {
    state.store = storeName;
  },

  toggleAdvancedWorker: () => {
    clearTimeout(state.countTimer);
    clearTimeout(state.flushTimer);

    self.postMessage({ toggleAdvancedWorker: { store: state.store } }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.

    // Web worker global function to terminate the web worker
    close();
  },

  destroyWorker: () => {
    clearTimeout(state.countTimer);
    clearTimeout(state.flushTimer);

    self.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.

    // Web worker global function to terminate the web worker
    close();
  },

  // Debounce count messages so we only process at most 1 every 5 seconds
  countUpdate(resource) {
    state.count.push(resource);

    if (!state.countTimer) {
      state.countTimer = setTimeout(() => {
        const last = state.count.pop();

        state.count = [];
        state.countTimer = null;

        load(last);
      }, COUNT_FLUSH_TIMEOUT);
    }
  },

  // Called to load schema
  loadSchema: (schemas) => {
    schemas.forEach((schema) => {
      // These properties are added to the object, but aren't on the raw object, so remove them
      // otherwise our comparison will show changes when there aren't any
      delete schema._id;
      delete schema._group;

      state.schema[schema.id] = hashObj(schema);
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
    state.queue = state.queue.filter(schema => schema.id !== id);

    // Delete the schema from the map, so if it comes back we don't ignore it if the hash is the same
    delete state.schema[id];
  }
};

onmessage = workerActions.onmessage; // bind everything to the worker's onmessage handler via the workerAction
