import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
  EVENT_DISCONNECT_ERROR,
} from '@shell/utils/socket';
import axios from 'axios'; // we'll need this to get resourcelists
import { get } from 'lodash';

const watchStatuses = {
  PENDING:    'pending', // created but not requested of the socket yet
  REQUESTED:  'requested', // requested but not confirmed by the socket yet
  WATCHING:   'watching', // confirmed as active by the socket
  REFRESHING: 'refreshing', // temporarily stopped while we make a full request to the API, will be rewatched afterwards
  CANCELLED:  'cancelled', // has been flagged to send a stop request to the socket
  REMOVED:    'removed' // stop request has been sent to the socket or it's been stopped by the socket itself and is now awaiting cleanup by the maintenanceInterval
};

const state = {
  store:        '',
  baseUrl:      '',
  socket:  {
    reference:     null,
    watches:       {}, // key: value store by resourcetype, includes watch status and msg payload for subscription
  },
  worker: {
    // we're going to let the maintenceInterval pick up when changes need to be sent and do that.
    outgoingPayload:         {},
    lastPayloadMutationTime: null,
    lastSentPayloadTime:     null,
    maintenanceIntervalId:   null // no current conditions under which we'd purge and recreate this but it's good to store anyways
  },
  resources:    {
    schema:       { // schema is pre-defined in here because we know it's going to be loaded from outside of the worker via message
      hashes:     {},
      collection: {}
    },
    counts: { // count is pre-defined in here because we know it's going to be loaded from outside of the worker via message
      hashes:     {},
      collection: {}
    }
  },
};

state.worker.maintenanceIntervalId = setInterval(() => {
  // Every 1 second we:
  if (state.baseUrl) {
    socketActions.syncWatches();
  }
  workerActions.sendPayloadIfQuiet();
}, 1000);

/* resources are the cache in which we store and maintain all data we recieve from the REST API and the websocket as well as the most recent request options
// resourceActions contains all the functions we'll need to update and delete from that cache to keep it as up to date as possible including
// constructing pages to send back to the UI thread
*/
const resourceActions = {
  loadSchemas: (schemas) => {
    // Trying to request schemas from inside the worker is all kinds of messy so we've got to pass the initial load from the UI thread
    schemas.forEach((schema) => {
      // These properties are added to the object, but aren't on the raw object, so remove them
      // otherwise our comparison will show changes when there aren't any
      delete schema._id;
      delete schema._group;

      state.resources.schema.hashes[schema.id] = hashObj(schema);
      state.resources.schema.collection[schema.id] = schema;
    });
  },
  // loadCounts is a special case because the initial request is coming from the UI thread and loaded in via special worker action, schemas are the same
  loadCounts: (counts) => {
    // the 'id' is always going to be count because this isn't really a collection... no need to loop
    state.resources.counts.hashes['count'] = hashObj(counts[0]); // there's always only 1 index in the array for counts since we treat the whole thing as a single object...
    state.resources.counts.collection['count'] = counts[0]; // there's always only 1 index in the array for counts since we treat the whole thing as a single object...
  },
  loadResources: ({ data }) => {
    const { resourceType, revision, data: resources = [] } = data;

    state.resources[resourceType].revision = revision;

    resources.forEach((resource) => {
      state.resources[resourceType].hashes[resource.id] = hashObj(resource);
      state.resources[resourceType].collection[resource.id] = resource;
    });

    resourceActions.mutatePayload(resourceType, true); // marked for immediate sending
  },
  setupResourceRequest: ({ type, opt, pagination }) => {
    state.resources[type] = {
      hashes:           {},
      collection:       {},
      revision:         undefined,
      requestOpt:       opt,
      lastFullSyncTime: undefined,
      pagination:       { // only used if pagination provided in request message, otherwise we send back the whole thing with pagination metadata full of nulls
        currentPage:     pagination?.currentPage,
        pageSize:        pagination?.pageSize,
        sortBy:          pagination?.sortBy,
        currentPageHash: undefined
      }
    };
    resourceActions.getFullResourceList(type);
  },
  getFullResourceList: (resourceType) => {
    state.resources[resourceType].lastFullSyncTime = Date.now();
    axios({ ...clone(state.resources[resourceType].requestOpt), headers: { Accept: 'application/json' } })
      .then((res) => {
        resourceActions.loadResources(res);
        // ToDo: need some logic to stop a watch on a resource and rewatch it with the correct revision if it's gotten out of sync
        socketActions.watch({ resourceType, resourceVersion: state.resources[resourceType].revision });
      });
  },
  fullResourceSync: () => {
    Object.keys(state.resources)
      .filter(resourceType => state.resources[resourceType].revision && state.resources[resourceType].requestOpt) // if the revision or request opt don't exist then no full sync is possible or required
      .filter(resourceType => Date.now - state.resources[resourceType].lastFullSyncTime > 260000) // every 4 minutes
      .forEach((resourceType) => {
        resourceActions.getFullResourceList(resourceType); // fire and forget so we don't hold up the maintenance interval
      });
    // we do this every 4 minutes on active resources, under normal circumstances this could cause multiple requests because we don't
    // find and cancel old requests before sending new ones but if we haven't gotten a response in 5 minutes then it's timed out anyways
  },
  'resource.change': ({ data, resourceType }) => {
    const id = data.id;
    const messageHash = hashObj(data);
    const type = resourceType || data.type;

    const hashes = state.resources[type].hashes;
    const existingHash = hashes[id];

    if (existingHash === messageHash) {
      return; // nothing changed so nothing needs doing
    }

    state.resources[type].hashes[id] = messageHash;
    state.resources[type].collection[id] = data;

    resourceActions.mutatePayload(type);
  },
  'resource.create': ({ resourceType, data }) => {
    const { id } = data.id;
    const messageHash = hashObj(data);
    const type = resourceType || data.type;

    state.resources[type].hashes[id] = messageHash;
    state.resources[type].collection[id] = data;

    resourceActions.mutatePayload(type);
  },
  'resource.remove': ({ resourceType, data }) => {
    const { id } = data.id;
    const type = resourceType || data.type;

    delete state.resources[type].hashes[id];
    delete state.resources[type].collection[id];

    resourceActions.mutatePayload(type);
  },
  'resource.start': ({ resourceType }) => {
    socketActions.watching(resourceType);
  },
  'resource.stop': ({ resourceType }) => {
    socketActions.stopped(resourceType);
  },
  ping:             () => {}, // we catch a bunch of pings, nothing to do with them right now.
  mutatePayload:    (resourceType, immediate = false) => {
    // ToDo: metadata.name is not always the default sortBy by resource...
    const sortBy = state.resources?.pagination?.sortBy || resourceType === 'metadata.name';
    const fullResourceList = Object.keys(state.resources[resourceType].collection)
      .map(id => (clone(state.resources[resourceType].collection[id]))) // reconstruct the full resource array
      .sort((a, b) => get(a, sortBy, a.id).localeCompare(get(b, sortBy, b.id))); // sort it

    let resourcePayload;

    // All the page construction goes here...
    if (state.resources[resourceType]?.pagination?.currentPage || state.resources[resourceType]?.pagination?.pageSize) {
      const { pageSize = 100, currentPage = 1 } = state.resources[resourceType]?.pagination;
      const indexFrom = pageSize * (currentPage - 1);
      const indexTo = indexFrom + pageSize;
      const page = [];

      for (let i = indexFrom; i <= indexTo; i++) {
        page.push(fullResourceList[i]);
      }

      const pageHash = hashObj(page);

      if (state.resources[resourceType]?.pagination?.currentPageHash !== pageHash) {
        state.resources[resourceType].pagination.currentPageHash = pageHash;
        resourcePayload = [...page];
      }
    } else {
      // we already know we mutated the resource array so we can just send it
      resourcePayload = [...fullResourceList];
    }

    if (immediate) {
      workerActions.sendPayload({ [resourceType]: resourcePayload });
    } else {
      state.worker.outgoingPayload[resourceType] = resourcePayload;
    }

    state.worker.lastPayloadMutationTime = Date.now();
    // setting the outgoingPayload will effectively schedule the mutation to be sent to the UI via the
    // workerActions.sendPayloadIfQuiet() function during the maintenanceInterval
  },
};

/* socketActions center around the websocket.
// Connect to the socket when needed
// Make sure resources are watching when needed
// Unsubscribe resources as needed
// Catch messages from the socket and route them to the correct handlers
*/
const socketActions = {
  connectSocket: () => {
    if (state.baseUrl) {
      state.socket.reference = new Socket(`${ state.baseUrl }/subscribe`);
      state.socket.reference.setAutoReconnect(true);
      state.socket.reference.addEventListener(EVENT_CONNECTED, (e) => {
        socketActions.syncWatches();
      });
      state.socket.reference.addEventListener(EVENT_DISCONNECTED, (e) => {
        // need handlers to perform any necessary self-care required on valid disconnect
        // the socket itself should handle any reconnect logic, do we still need this?
      });

      state.socket.reference.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        // need handlers to pass these events to the UI thread for growl purposes
      });

      state.socket.reference.addEventListener(EVENT_DISCONNECT_ERROR, (e) => {
        // need handlers to pass these events to the UI thread for growl purposes
      });

      state.socket.reference.addEventListener(EVENT_MESSAGE, (e) => {
        const event = e.detail;

        if ( event.data) {
          const msg = JSON.parse(event.data);

          if (resourceActions[msg.name]) {
            resourceActions[msg.name](msg);
          } else {
            console.warn('no associated socket action for:', msg); // eslint-disable-line no-console
          }
        }
      });
      state.socket.reference.connect();
    } else {
      console.warn(`Cannot connect websocket in worker "${ state.store }": no baseUrl`); // eslint-disable-line no-console
    }
  },
  syncWatches: () => {
    const {
      PENDING, REQUESTED, WATCHING, CANCELLED, REMOVED
    } = watchStatuses;

    const watchesArray = [...Object.keys(state.socket.watches)].map(key => state.socket.watches[key]); // convert to array

    if (state?.socket?.reference?.isConnected()) {
      watchesArray
        .filter(watch => watch.status !== WATCHING) // we only want the unwatched watches
        .forEach((watch) => {
          const { resourceType } = watch.payload;

          if (watch.status === PENDING) {
            const ok = state.socket.reference.send(JSON.stringify(watch.payload));

            if (ok) {
              state.socket.watches[resourceType].status = REQUESTED;
            }
          } else if (watch.status === CANCELLED) {
            const ok = state.socket.reference.send(JSON.stringify({ resourceType, stop: true }));

            if (ok) {
              state.socket.watches[resourceType].status = REMOVED;
              delete state.resources.schema[resourceType];
              // ToDo: send message to UI thread to get rid of resource in store
            }
          }
        });

      // filter out the removed watches, convert back to an object, reassign it to the watches object in state.socket
      state.socket.watches = watchesArray.filter(watch => watch.status !== REMOVED).reduce((acc, watch) => {
        return { ...acc, [watch.payload.resourceType]: watch };
      }, {});
    } else if (!state?.socket?.reference?.isConnecting()) {
      state.socket.watches = watchesArray
        .map((watch) => {
          return {
            ...watch,
            status: [PENDING, REQUESTED, WATCHING].includes(watch.status) ? PENDING : REMOVED
          };
        })
        .reduce((acc, watch) => ({ ...acc, [watch.payload.resourceType]: watch }), {}); // convert back to an object
      if (Object.keys(state.socket.watches).length > 0) { // no need to connect if there's no watches
        socketActions.connectSocket();
      }
    }
  },
  refresh: (type) => {
    const { REFRESHING } = watchStatuses;

    state.socket.watches[type].status = REFRESHING;
  },
  watch: (msg) => {
    const { PENDING } = watchStatuses;

    state.socket.watches[msg.resourceType] = { status: PENDING, payload: msg };
    if (state.baseUrl) {
      socketActions.syncWatches();
    }
  },
  watching: (type) => {
    const { WATCHING } = watchStatuses;

    state.socket.watches[type].status = WATCHING;
  },
  unwatch: (type) => {
    const { CANCELLED } = watchStatuses;

    state.socket.watches[type].status = CANCELLED;
    if (state.baseUrl) {
      socketActions.syncWatches();
    }
  },
  stopped: (type) => {
    const { REFRESHING } = watchStatuses;

    if (state.resources[type].revision && state.resources[type].requestOpt) {
      state.socket.watches[type].status = REFRESHING;
      resourceActions.getFullResourceList(type);
    } else {
      socketActions.watch({ resourceType: type });
    }
  }
};

/* workerActions center around communications between the UI thread and the worker.
// It'll catch messages from the UI thread and route them to the correct handlers
// It'll also format and send any messages back to the UI thread
*/
const workerActions = {
  onmessage: (e) => {
    /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
    // good enough for now considering that we never send more than one message action at a time right now */
    const messageActions = Object.keys(e?.data);

    messageActions.forEach((action) => {
      if (workerActions[action]) {
        workerActions[action](e?.data[action]);
      } else {
        console.warn('no associated worker action for:', action); // eslint-disable-line no-console
      }
    });
  },
  initWorker: ({ storeName }) => {
    state.store = storeName;
  },
  destroyWorker: () => {
    clearTimeout(state.countTimer);
    clearTimeout(state.flushTimer);

    self.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.

    // Web worker global function to terminate the web worker
    close();
  },
  watch: (msg) => {
    socketActions.watch(msg);
  },
  connect: (url) => {
    state.baseUrl = url;
    socketActions.connectSocket();
  },
  // loadSchemas is a special case because the initial request is coming from the UI thread and loaded in via special worker action, counts is the same
  loadSchemas: (schemas) => {
    resourceActions.loadSchemas(schemas);
  },
  // loadCounts is a special case because the initial request is coming from the UI thread and loaded in via special worker action, schemas are the same
  loadCounts: (counts) => {
    resourceActions.loadCounts(counts);
  },
  sendPayload: (payload) => {
    // self.postMessage({ singleChange: payload });
    self.postMessage({ batchChanges: payload });
  },
  sendPayloadIfQuiet: () => {
    const { outgoingPayload, lastPayloadMutationTime, lastSentPayloadTime } = state.worker;
    const hasPayload = Object.keys(outgoingPayload).length > 0;

    // if we haven't mutated the payload in the last 1 second or if we haven't sent the payload in the last 30 seconds
    if (hasPayload && (Date.now() - lastPayloadMutationTime > 1000 || Date.now() - lastSentPayloadTime > 30000)) {
      self.postMessage({ batchChanges: clone(outgoingPayload) });
      state.worker.lastSentPayloadTime = Date.now();
      state.worker.outgoingPayload = {};
    }
  },
  requestResourceList: (opt) => {
    resourceActions.setupResourceRequest(opt);
  }
};

onmessage = workerActions.onmessage; // bind everything to the worker's onmessage handler via the workerAction

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

// Scrub a copy of an object clean of any nested references
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
