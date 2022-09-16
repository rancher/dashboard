import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
  EVENT_DISCONNECT_ERROR,
} from '@shell/utils/socket';
import { SCHEMA } from '@shell/config/types';

const state = {
  store:        '',
  baseUrl:      '',
  socket:       undefined,
  watches:      [], // each watch will be an object with a 'watched' boolean, true means we've sent the message through the socket, false means we haven't
  // outGoingMessageQueue: [], // don't need this just yet, needed for batching messages when we get to debounce again
  counts:       [],
  resources:    {
    schema:       { // schema is pre-defined in here because we know it's going to be loaded from outside of the worker via message
      hashes:     {},
      collection: {},
      // ToDo: don't forget to add a special case for schemas to not include a revision when re-subscribing to schemas and counts
      revision:   0, // the schema collection doesn't actually have a revisionId which I need to ask BE about...
      // orderedIds: [] // if performance becomes a concern later we can use something like this to save some clock cycles when we reconstruct the array...
      pagination: { // only used if pagination provided in request message, otherwise we send back the whole thing with pagination metadata full of nulls
        currentPage: null,
        pageSize:    null,
      }
    },
    count: { // count is pre-defined in here because we know it's going to be loaded from outside of the worker via message
      hashes:     {},
      collection: {},
      // ToDo: don't forget to add a special case for schemas to not include a revision when re-subscribing to schemas and counts
      revision:   0 // the schema collection doesn't actually have a revisionId which I need to ask BE about...
      // orderedIds: [] // if performance becomes a concern later we can use something like this to save some clock cycles when we reconstruct the array...
    }
  },
};

// const workerHygeineIntervalID = setInterval(() => {
// /* ToDo: Every 1 minute we:
// // * clean up the caches - get rid of any we're not listening for anymore
// // * re-request any lists from REST that we ARE listening for so our revisionId doesn't get too out of sync
// // * kill the socket and reopen it to kill any subscriptions we don't want (there's got to be a better way to unsubscribe...)
// // * drain queue if exists
// */
// }, 60000);

// ToDo: need to think about validating synconicity with the UI thread and recovery if needed.
const stateActions = {
  'resource.change': ({ data, resourceType }) => {
    // console.log(JSON.parse(JSON.stringify(msg)));

    const id = data.id;

    const hashes = state.resources[resourceType].hashes;
    const existingHash = hashes[id];
    const messageHash = hash(data);

    if (existingHash === messageHash) {
      return; // nothing changed so nothing needs doing
    }
    // mutate the hash and collection so they're up to data

    state.resources[resourceType].hashes[id] = messageHash;
    state.resources[resourceType].collection[id] = data;
    state.resources[resourceType].revision++;
    // for right now, need additional logic for debouncing and queing so as not to flood the UI thread

    // ToDo: need to compare revisionIds and ignore if the received is less than the revisionId we have in the collection
    self.postMessage({
      load: {
        data,
        resourceType:  SCHEMA,
        type:          'resource.change'
      }
    });
  }
};

const socketActions = {
  connectSocket: () => {
    if (state.baseUrl) {
      state.socket = new Socket(`${ state.baseUrl }/subscribe`);
      state.socket.setAutoReconnect(true);
      state.socket.addEventListener(EVENT_CONNECTED, (e) => {
        socketActions.syncWatches();
        // ToDo: setup a setInterval here that'll inspect hashes for changes, batch them up, send them over to the UI thread to figure out
      });
      state.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        // need handlers to perform any necessary self-care required on valid disconnect
        // the socket itself should handle any reconnect logic, do we still need this?
      });

      state.socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        // need handlers to pass these events to the UI thread...
      });

      state.socket.addEventListener(EVENT_DISCONNECT_ERROR, (e) => {
        // need handlers to pass these events to the UI thread...
      });

      state.socket.addEventListener(EVENT_MESSAGE, (e) => {
        const event = e.detail;

        if ( event.data) {
          const msg = JSON.parse(event.data);

          if (stateActions[msg.name]) {
            stateActions[msg.name](msg);
          }
        }
      });
      state.socket.connect();
    } else {
      console.warn(`Cannot connect websocket in worker "${ state.store }": no baseUrl`); // eslint-disable-line no-console
    }
  },
  syncWatches: () => {
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
      socketActions.connectSocket();
    }
  }
};

const workerActions = {
  onmessage: (e) => {
    // ToDo: can't remember the exact reason I'm converting this into an array of keys...
    // maybe to help with batching later? if it's not in an array though it doesn't preserve order which makes the batching useless...
    const messageActions = Object.keys(e?.data);

    messageActions.forEach((action) => {
      if (workerActions[action]) {
        workerActions[action](e?.data[action]);
      } else {
        console.warn('no associated action for:', action); // eslint-disable-line no-console
      }
    });
  },
  watch: (msg) => {
    state.watches.push({ watched: false, payload: msg });
    socketActions.syncWatches();
  },
  initWorker: ({ storeName }) => {
    state.store = storeName;
  },
  connect: (url) => {
    state.baseUrl = url;
    socketActions.connectSocket();
  },
  // loadSchemas is a special case because the initial request is coming from the UI thread and loaded in via special worker action, counts is the same
  loadSchemas: (schemas) => {
    // ToDo: Trying to request schemas from inside the worker is all kinds of messy so we've got to pass
    // the initial load from the UI thread, need to figure out how to re-request it if the worker dies
    schemas.forEach((schema) => {
      // These properties are added to the object, but aren't on the raw object, so remove them
      // otherwise our comparison will show changes when there aren't any
      delete schema._id;
      delete schema._group;

      state.resources.schema.hashes[schema.id] = hashObj(schema);
      state.resources.schema.collection[schema.id] = schema;
    });
    // console.log(JSON.parse(JSON.stringify(state.resources.schemas)));
  },
  // loadCounts is a special case because the initial request is coming from the UI thread and loaded in via special worker action, schemas are the same
  loadCounts: (counts) => {
    // the 'id' is always going to be count because this isn't really a collection... no need to loop
    state.resources.count.hashes['count'] = hashObj(counts[0]); // there's always only 1 index in the array for counts since we treat the whole thing as a single object...
    state.resources.count.collection['count'] = counts[0]; // there's always only 1 index in the array for counts since we treat the whole thing as a single object...
  }
};

// utility functions go down here for now...
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

onmessage = workerActions.onmessage; // bind everything to the worker's onmessage handler via the workerAction
