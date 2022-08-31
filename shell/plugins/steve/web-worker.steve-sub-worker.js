import { SCHEMA } from '@shell/config/types';
import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
  EVENT_DISCONNECT_ERROR,
} from '@shell/utils/socket';

const COUNTS_FLUSH_TIMEOUT = 5000;
const SCHEMA_FLUSH_TIMEOUT = 2500;

// ToDo: need to think about validating synconicity with the UI thread and recovery if needed.

const state = {
  store:      '',
  baseUrl:    '',
  socket:     undefined,
  counts:     [],
  countTimer: undefined,
  flushTimer: undefined,
  queue:      [],
  schemas:    [],
  watches:    [] // each watch will be an object with a 'watched' boolean, true means we've sent the message through the socket, false means we haven't
};

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

function load(data) {
  // ToDo: write now this is the only way for us to pass back data to the UI thread which I'm currently reworking to be a bit more flexible
  self.postMessage({ load: data });
}

function connectSocket() {
  if (state.baseUrl) {
    state.socket = new Socket(`${ state.baseUrl }/subscribe`);
    state.socket.setAutoReconnect(true);
    state.socket.addEventListener(EVENT_CONNECTED, (e) => {
      syncWatches();
      // ToDo: setup a setInterval here that'll inspect hashes for changes, batch them up, send them over to the UI thread to figure out
    });
    state.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
      console.log(EVENT_DISCONNECTED, e);
    });

    state.socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
      console.log(EVENT_CONNECT_ERROR, e);
    });

    state.socket.addEventListener(EVENT_DISCONNECT_ERROR, (e) => {
      console.log(EVENT_DISCONNECT_ERROR, e);
    });

    state.socket.addEventListener(EVENT_MESSAGE, (e) => {
      const event = e.detail;

      if ( event.data) {
        const msg = JSON.parse(event.data);

        if (stateMutations[msg.name]) {
          stateMutations[msg.name](msg?.data?.id);
        }

        // loadPage(makePage(opt, from, to));
      }
    });
    state.socket.connect();
  } else {
    console.warn(`Cannot connect websocket in worker "${ state.store }": no baseUrl`); // eslint-disable-line no-console
  }
}

function syncWatches() {
  if (state?.socket?.isConnected()) {
    state.watches
      .filter(watch => !watch.watched) // we only want the unwatched watches
      .forEach((watch, i) => {
        const ok = state.socket.send(JSON.stringify(watch.payload));

        if (ok) {
          state.watches[i].watched = true;
        }
      });
  } else if (!state?.socket?.isConnecting()) {
    state.watches = state.watches.map((watch) => {
      return {
        ...watch,
        watched: false
      };
    });
    connectSocket();
  }
}

onmessage = (e) => {
  const messageActions = Object.keys(e?.data);

  messageActions.forEach((action) => {
    if (workerActions[action]) {
      workerActions[action](e?.data[action]);
    } else {
      console.warn('no associated action for:', action); // eslint-disable-line no-console
    }
  });
};

const workerActions = {
  watch: (msg) => {
    state.watches.push({ watched: false, payload: msg });
    syncWatches();
  },
  initWorker: ({ storeName }) => {
    state.store = storeName;
  },
  connect: (url) => {
    state.baseUrl = url;
    connectSocket();
  },
  destroyWorker: () => {
    // ToDo: put some more thought into destroying the worker and cleaning up

    // Web worker global function to terminate the web worker
    close();
  },
  countsUpdate: (resource) => {
    // ToDo: put some more thought into how we get here generically and how we message the UI thread generically
  },
  loadSchema: (schemas) => {
    // ToDo: Trying to request schemas from inside the worker is all kinds of messy so we've got to pass
    // the initial load from the UI thread, need to figure out how to re-request it if the worker dies
    schemas.forEach((schema) => {
      // These properties are added to the object, but aren't on the raw object, so remove them
      // otherwise our comparison will show changes when there aren't any
      delete schema._id;
      delete schema._group;

      state.schemas[schema.id] = hashObj(schema);
    });
  },
  updateSchema: (schema) => {
    // Add the schema to the queue to be checked to see if the schema really changed
    // ToDo: Comparison of individual resources should be done in real-time and then a final comparison at message time to determine if we really need to send to the UI thread
    // state.queue.push(schema);
  },
  removeSchema: (id) => {
    // ToDo: Should be handled generically
    // Remove anything in the queue related to the schema - we don't want to send any pending updates later for a schema that has been removed
    state.queue = state.queue.filter(schema => schema.id !== id);

    // Delete the schema from the map, so if it comes back we don't ignore it if the hash is the same
    delete state.schemas[id];
  }
};
