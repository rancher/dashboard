import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
  EVENT_DISCONNECT_ERROR,
} from '@shell/utils/socket';
import { COUNT, SCHEMA } from '@shell/config/types';
import resourceCachesClasses from './resourceCaches';
import pluralize from 'pluralize';
import { cloneDeep } from 'lodash';

const watchStatuses = {
  PENDING:    'pending', // created but not requested of the socket yet
  REQUESTED:  'requested', // requested but not confirmed by the socket yet
  WATCHING:   'watching', // confirmed as active by the socket
  REFRESHING: 'refreshing', // temporarily stopped while we make a full request to the API, will be rewatched afterwards
  CANCELLED:  'cancelled', // has been flagged to send a stop request to the socket
  REMOVED:    'removed' // stop request has been sent to the socket or it's been stopped by the socket itself and is now awaiting cleanup by the maintenanceInterval
};

const cacheStatuses = {
  STARTING: 'starting', // still just spinning up, doesn't have a real status yet
  INACTIVE: 'inactive', // not currently in use, ready to be purged
  ACTIVE:   'active', // currently in use by the UI thread
  REQUIRED: 'required' // not actually in use by the UI thread, but required by another cache
};

const {
  PENDING, REFRESHING, REQUESTED, WATCHING, CANCELLED, REMOVED
} = watchStatuses;

const {
  // STARTING, INACTIVE, ACTIVE, REQUIRED
  ACTIVE, REQUIRED, INACTIVE
} = cacheStatuses;

const caches = {};

// const pruneCaches = () => {
// const requiredCaches = [...new Set(Object.values(caches).map(cache => cache.relatedTypes || []).flat())];
// Object.keys(caches).forEach(cacheKey => {
//   const cacheRequired = requiredCaches.includes(cacheKey);
//   if (cache[cacheKey].getStatus() === INACTIVE && !cacheRequired) {
//     delete cache[cacheKey];
//   }
// })

// };

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
  resources: {}
};

state.worker.maintenanceIntervalId = setInterval(() => {
  // Every 1 second we:
  if (state.baseUrl) {
    socketActions.syncWatches();
  }
  workerActions.sendPayloadIfQuiet();
  // pruneCaches(); // turning off for now until I figure out delayed columns
}, 1000);

/* resources are the cache in which we store and maintain all data we recieve from the REST API and the websocket as well as the most recent request options
// resourceActions contains all the functions we'll need to update and delete from that cache to keep it as up to date as possible including
// constructing pages to send back to the UI thread
*/
const resourceActions = {
  loadSchema: (schemas) => {
    if (!caches[SCHEMA]) {
      const startWatch = () => socketActions.watch({ resourceType: SCHEMA });
      const stopWatch = () => socketActions.unwatch({ resourceType: SCHEMA });
      const schemaSchema = schemas.find(schema => schema.id === SCHEMA); // because even schemas have a schema

      caches[SCHEMA] = new resourceCachesClasses.SchemaCache(schemaSchema, {}, { startWatch, stopWatch });
    }
    caches[SCHEMA].loadSchema(schemas);
    caches[SCHEMA].syncCollection();
  },
  // loadCount is a special case because the initial request is coming from the UI thread and loaded in via special worker action, schemas are the same
  loadCount: (count) => {
    if (!caches[COUNT]) {
      const startWatch = () => socketActions.watch({ resourceType: COUNT });
      const stopWatch = () => socketActions.unwatch({ resourceType: COUNT });
      const countSchema = caches[SCHEMA].getById(COUNT);

      caches[COUNT] = new resourceCachesClasses.CountCache(countSchema, {}, { startWatch, stopWatch });
    }
    caches[COUNT].loadCount(count);
    caches[COUNT].syncCollection();
  },
  createResourceCache: async(type, schema) => {
    const typeSchema = schema || caches[SCHEMA].getById(type);
    const cacheClassName = `${ typeSchema?.attributes?.kind || 'Resource' }Cache`;
    const CacheClass = resourceCachesClasses[cacheClassName] || resourceCachesClasses.ResourceCache;

    const startWatch = revision => socketActions.watch({ resourceType: type, resourceVersion: revision });
    const stopWatch = () => socketActions.unwatch({ resourceType: type });
    const watchStatus = () => state.socket.watches[type]?.status;
    const getCacheByType = async(type) => {
      if (!caches[type]) {
        await resourceActions.createResourceCache(type);
      }

      return caches[type];
    };
    const sendResponse = (hash, payload) => {
      const dependentCaches = Object.values(caches).filter(cache => cache.relatedTypes.includes(type));

      dependentCaches.forEach((cache) => {
        cache.bumpCache();
      });
      // if we have a hash then that means somebody in the UI thread wants it
      caches[type].setStatus(ACTIVE);
      workerActions.sendResponse({ messageHash: hash, [type]: payload });
    };
    const updateBatch = (updatePayload) => {
      const dependentCaches = Object.values(caches).filter(cache => cache.relatedTypes.includes(type));

      dependentCaches.forEach((cache) => {
        cache.bumpCache();
      });
      if (caches[type].getStatus() === ACTIVE) {
        // we only need to batch if for the payload if it's currently active
        state.worker.outgoingPayload[type] = updatePayload;
      }
    };

    caches[type] = new CacheClass(typeSchema, {}, {
      startWatch, stopWatch, watchStatus, getCacheByType, sendResponse, updateBatch
    });
    await caches[type].getLatest();

    return caches[type];
  },
  setupResourceRequest: ({ type, opt, skipGet }, messageHash) => {
    const pagination = {
      currentPage:     opt?.pagination?.currentPage,
      pageSize:        opt?.pagination?.pageSize,
      sortBy:          opt?.pagination?.sortBy,
      search:          opt?.pagination?.search,
    };

    if (!caches[type]) {
      const typeSchema = opt?.schema || caches[SCHEMA].getById(type);

      resourceActions.createResourceCache(type, typeSchema).then(() => {
        if (!skipGet) {
          if (!opt?.pagination) {
            caches[type].requestAll(messageHash);
          }
          caches[type].requestPage(pagination, messageHash);
        }
      });
    } else if (!skipGet) {
      if (!opt?.pagination) {
        caches[type].requestAll(messageHash);
      }
      caches[type].requestPage(pagination, messageHash);
    }
  },
  requestPage: async(resourceType, pagination, messageHash) => {
    if (!caches[resourceType]) {
      await resourceActions.createResourceCache(resourceType);
    }
    caches[resourceType].requestPage(pagination, messageHash);
  },
  requestAll: async(resourceType, messageHash) => {
    if (!caches[resourceType]) {
      await resourceActions.createResourceCache(resourceType);
    }
    caches[resourceType].requestAll(messageHash);
  },
  fullResourceSync: () => {
    Object.keys(state.resources)
      .filter(resourceType => state.resources[resourceType].revision && state.resources[resourceType].requestOpt) // if the revision or request opt don't exist then no full sync is possible or required
      .filter(resourceType => Date.now - state.resources[resourceType].lastFullSyncTime > 260000) // every 4 minutes
      .forEach((resourceType) => {
        caches[resourceType].syncCollection(); // fire and forget so we don't hold up the maintenance interval
      });
    // we do this every 4 minutes on active resources, under normal circumstances this could cause multiple requests because we don't
    // find and cancel old requests before sending new ones but if we haven't gotten a response in 5 minutes then it's timed out anyways
  },
  'resource.change': ({ data: resource }) => {
    const type = resource.type;

    if (caches[type]) {
      caches[type].updateResource(resource);
    }
  },
  'resource.create': ({ data: resource }) => {
    const type = resource.type;

    if (caches[type]) {
      caches[type].createResource(resource);
    }
  },
  'resource.remove': ({ data: resource }) => {
    const type = resource.type;

    if (caches[type]) {
      caches[type].removeResource(resource);
    }
  },
  'resource.start': ({ resourceType }) => {
    socketActions.watching(pluralize(resourceType, 1)); // 'count' sometimes comes in as 'counts'
  },
  'resource.stop': ({ resourceType }) => {
    socketActions.stopped(pluralize(resourceType, 1)); // 'count' sometimes comes in as 'counts'
  },
  'resource.error': () => {}, // ToDo: we're just eat errors for the time being
  ping:             () => {}, // ToDo: we catch a bunch of pings, nothing to do with them right now.
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
      // ToDo: record when we started trying to connect, the socket itself should do most of this...
      state.socket.reference.connect();
    } else {
      console.warn(`Cannot connect websocket in worker "${ state.store }": no baseUrl`); // eslint-disable-line no-console
    }
  },
  syncWatches: () => {
    // ToDo: come back to this whole thing and walk it through carefully again...
    const watchesArray = [...Object.keys(state.socket.watches)].map(key => state.socket.watches[key]); // convert to array

    if (state?.socket?.reference?.isConnected()) {
      watchesArray
        .filter(watch => watch.status !== WATCHING) // we only want the unwatched watches
        .forEach((watch) => {
          const { resourceType } = watch.payload;

          if (watch.status === PENDING) {
            // then we're going to send the request across the socket
            const ok = state.socket.reference.send(JSON.stringify(watch.payload));

            if (ok) {
              state.socket.watches[resourceType].status = REQUESTED;
            }
          } else if (watch.status === CANCELLED) {
            // then we're going to send the stop
            const ok = state.socket.reference.send(JSON.stringify({ resourceType, stop: true }));

            if (ok) {
              state.socket.watches[resourceType].status = REMOVED;
              delete state.resources[resourceType];
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
    // ToDo: add an if on here to look at how long ago we started trying to connect
  },
  refresh: (type) => {
    state.socket.watches[type].status = REFRESHING;
  },
  watch: (msg) => {
    state.socket.watches[msg.resourceType] = { status: PENDING, payload: msg };
    if (state.baseUrl) {
      socketActions.syncWatches();
    }
  },
  watching: (type) => {
    state.socket.watches[type].status = WATCHING;
  },
  unwatch: (type) => {
    // ToDo: we've probably got a dedup around here somewhere...
    const watch = state.socket.watches[type];
    const requiredCaches = [...new Set(Object.values(caches).map(cache => cache.relatedTypes || []).flat())];
    const cacheRequired = requiredCaches.includes(type);

    if (watch && cacheRequired) {
      caches[type].setStatus = REQUIRED;
    } else {
      caches[type].setStatus = INACTIVE;
      watch.status = CANCELLED;
      if (state.baseUrl) {
        socketActions.syncWatches();
      }
    }
  },
  stopped: (type) => {
    caches[type].syncCollection();
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
        workerActions[action](cloneDeep(e?.data[action]));
      } else {
        console.warn('no associated worker action for:', action); // eslint-disable-line no-console
      }
    });
  },
  toggleAdvancedWorker: () => {
    clearTimeout(state.countTimer);
    clearTimeout(state.flushTimer);

    self.postMessage({ toggleAdvancedWorker: { store: state.store, resources: Object.keys(state.resources) } }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.

    // Web worker global function to terminate the web worker
    close();
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
  // loadSchemas is a special case because the initial request is coming from the UI thread and loaded in via special worker action, count is the same
  loadSchema: (schemas) => {
    resourceActions.loadSchema(schemas);
  },
  // loadCount is a special case because the initial request is coming from the UI thread and loaded in via special worker action, schemas are the same
  loadCount: (count) => {
    resourceActions.loadCount(count);
  },
  sendResponse: (payload) => {
    self.postMessage({ awaitedResponse: payload });
  },
  sendPayload: (payload) => {
    self.postMessage({ batchChanges: payload });
  },
  sendPayloadIfQuiet: () => {
    const { outgoingPayload, lastPayloadMutationTime, lastSentPayloadTime } = state.worker;
    const hasPayload = Object.keys(outgoingPayload).length > 0;

    // if we haven't mutated the payload in the last 1 second or if we haven't sent the payload in the last 30 seconds
    if (hasPayload && (Date.now() - lastPayloadMutationTime > 1000 || Date.now() - lastSentPayloadTime > 30000)) {
      self.postMessage({ batchChanges: cloneDeep(outgoingPayload) });
      state.worker.lastSentPayloadTime = Date.now();
      state.worker.outgoingPayload = {};
    }
  },
  requestResourceList: (opt) => {
    resourceActions.setupResourceRequest(opt);
  },
  waitingForResponse: (req) => {
    const { messageHash, msg } = req;

    resourceActions.setupResourceRequest(msg, messageHash);
  }
};

onmessage = workerActions.onmessage; // bind everything to the worker's onmessage handler via the workerAction
