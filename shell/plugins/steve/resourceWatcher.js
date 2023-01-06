/**
 * Imports in a worker cannot include exports from the file invoking the worker or from files importing the invoking file.
 */

import Socket, {
  NO_WATCH,
  NO_SCHEMA,
  EVENT_MESSAGE
} from '@shell/utils/socket';
import { addParam } from '@shell/utils/url';

export const WATCH_STATUSES = {
  PENDING:    'pending', // created but not requested of the socket yet
  REQUESTED:  'requested', // requested but not confirmed by the socket yet
  WATCHING:   'watching', // confirmed as active by the socket
  REFRESHING: 'refreshing', // temporarily stopped while we make a full request to the API, will be rewatched afterwards
  STOPPED:    'stopped', // temporarily stopped via message from the socket, a watch should immediately be triggered but the maintenance cycle will pick it up if that doesn't happen.
  REMOVED:    'removed' // stop request has been sent to the socket or it's been stopped by the socket itself and is now awaiting a resource.stop message
};

export const keyForSubscribe = ({
  resourceType, type, namespace, id, selector
} = {}) => {
  return [(resourceType || type), namespace, id, selector] // each watch param in an array
    .filter(param => !!param) // filter out all the empty ones // the filter makes these keys neater
    .join('/'); // join into a string so we can use it as an object key
};

export const watchKeyFromMessage = (msg) => {
  const {
    resourceType,
    namespace,
    id,
    selector
  } = msg;

  const watchObject = {
    resourceType,
    id,
    namespace,
    selector
  };

  return keyForSubscribe(watchObject);
};

const {
  PENDING, REQUESTED, WATCHING, REFRESHING, STOPPED, REMOVED
} = WATCH_STATUSES;

export default class ResourceWatcher extends Socket {
  watches = {}; // TODO: RC Ensure these are wired in to canWatch and watchStarted sub getters
  maintenanceInterval;
  connectionMetadata;
  status = ''

  constructor(url, autoReconnect = true, frameTimeout = null, protocol = null, maxTries = null) {
    super(url, autoReconnect, frameTimeout, protocol, maxTries);
    this.baseUrl = self.location.origin + url.replace('subscribe', '');

    this.maintenanceInterval = setInterval(() => {
      // Every 1 second we:
      if (this.baseUrl) {
        this.syncWatches();
      }
    }, 1000);
  }

  setConnectionMetadata(connectionMetadata) {
    if (!this.connectionMetadata) {
      this.connectionMetadata = {};
    }
    this.connectionMetadata = {
      ...connectionMetadata,
      idAsTimestamp: true
    };
  }

  watchExists(watchKey) {
    return !!this.watches?.[watchKey];
  }

  async watch(watchKey, providedResourceVersion, providedResourceVersionTime, providedKeyParts = {}, providedSkipResourceVersion) {
    const {
      resourceType: providedResourceType,
      id: providedId,
      namespace: providedNamespace,
      selector: providedSelector
    } = providedKeyParts;
    const resourceType = providedResourceType || this.watches?.[watchKey]?.resourceType;
    const id = providedId || this.watches?.[watchKey]?.id;
    const namespace = providedNamespace || this.watches?.[watchKey]?.namespace;
    const selector = providedSelector || this.watches?.[watchKey]?.selector;
    let skipResourceVersion = this.watches?.[watchKey]?.skipResourceVersion || providedSkipResourceVersion;

    const watchObject = {
      resourceType,
      id,
      namespace,
      selector
    };

    let resourceVersionTime = providedResourceVersionTime || this.watches?.[watchKey]?.resourceVersionTime;
    let resourceVersion = providedResourceVersion || this.watches?.[watchKey]?.resourceVersion;

    if (!skipResourceVersion && (!resourceVersion || Date.now() - resourceVersionTime > 300000)) { // 300000ms is 5minutes
      const resourceUrl = this.baseUrl + resourceType;
      const limitedResourceUrl = addParam(resourceUrl, 'limit', 1);
      const opt = {
        method:      'get',
        headers:     { accept: 'application/json' },
        credentials: 'same-origin'
      };

      // ToDo: need to find a way to sync the csrf header into the worker since it can't directly access the cookies...
      await fetch(limitedResourceUrl, opt)
        .then((res) => {
          this.watches[watchKey] = { ...watchObject };
          if (!res.ok) {
            this.watches[watchKey].error = res.json();
            console.warn(`Resource error retrieving resourceVersion`, resourceType, ':', res.json()); // eslint-disable-line no-console
          } else {
            this.watches[watchKey].error = undefined;
          }

          return res.json();
        })
        .then((res) => {
          if (res.revision) {
            resourceVersionTime = Date.now();
            resourceVersion = res.revision;
          } else if (!this.watches[watchKey].error) {
            // if there wasn't a revision in the response and there wasn't an error we wrote to the watch then the resource doesn't get a revision and we can skip it on subsequent rewatches
            skipResourceVersion = true;
          }
        });
    }

    if (![PENDING, REQUESTED, WATCHING, REFRESHING].includes(this.watches?.[watchKey]?.status)) {
      this.watches[watchKey] = {
        ...watchObject,
        status: WATCH_STATUSES.PENDING,
        resourceVersion,
        resourceVersionTime,
        skipResourceVersion
      };
    }
  }

  unwatch(watchKey) {
    const watch = this.watches?.[watchKey] || {};
    const {
      resourceType, id, namespace, selector
    } = watch;
    const watchObject = {
      resourceType,
      id,
      namespace,
      selector
    };

    // TODO: RC TEST come back and ensure forgetType calls from explorer cluster dashboard page  --> other cluster page all work fine
    if (resourceType && this.watches[watchKey].status !== REMOVED) {
      this.send(JSON.stringify({
        ...watchObject,
        stop: true
      }));
      this.watches[watchKey].status = REMOVED;
    }
  }

  // TODO: RC why can't we just watch/unwatch on demand?
  syncWatches() {
    const watchesArray = Object.values(this.watches); // convert to array

    if (this.isConnected()) {
      if (watchesArray.length > 0) {
        watchesArray
          .forEach((watch) => {
            const {
              resourceType, id, namespace, selector, resourceVersion, status, skipResourceVersion
            } = watch;
            const watchObject = {
              resourceType,
              id,
              namespace,
              selector
            };
            const watchKey = keyForSubscribe(watchObject);

            if (status === PENDING) {
              this.send(JSON.stringify({
                ...watchObject,
                resourceVersion: !skipResourceVersion ? resourceVersion : undefined
              }));
              this.watches[watchKey].status = REQUESTED;
            }
          });
      }
    } else if (watchesArray.length > 0) {
      watchesArray
        .forEach((watch) => {
          const { status } = watch;
          const watchKey = keyForSubscribe(watch);

          if ([PENDING, REQUESTED, WATCHING, REFRESHING].includes(status)) {
            this.watch(watchKey);
          } else {
            delete this.watches[watchKey];
          }
        });

      this.connect(this.connectionMetadata);
    }
  }

  /**
   * Handles message from Backend to UI
   */
  _onmessage(event) {
    const {
      name: eventName, resourceType, data: { type }, id, namespace, selector, data
    } = JSON.parse(event.data);
    const watchKey = keyForSubscribe({
      resourceType,
      type,
      id,
      namespace,
      selector
    });

    if (eventName === 'resource.start' && this.watches?.[watchKey]?.status === REQUESTED) {
      this.watches[watchKey].status = WATCHING;
    } else if (eventName === 'resource.stop' && this.watches?.[watchKey]) {
      if (this.watches?.[watchKey]?.status === REMOVED) {
        delete this.watches[watchKey];
      } else {
        this.watches[watchKey].status = STOPPED;
        delete this.watches[watchKey].resourceVersion;
        delete this.watches[watchKey].resourceVersionTime;
        this.watch(watchKey);
        this.dispatchEvent(new CustomEvent(EVENT_MESSAGE, { detail: event }));
      }
    } else if (eventName === 'resource.error') {
      const err = data?.error?.toLowerCase();

      if ( this.watches[watchKey] && err.includes('watch not allowed') ) {
        this.watches[watchKey].error = { type: resourceType, reason: NO_WATCH };
        this.unwatch(watchKey);
      } else if ( this.watches[watchKey] && err.includes('failed to find schema') ) {
        this.watches[watchKey].error = { type: resourceType, reason: NO_SCHEMA };
        this.unwatch(watchKey);
      } else if ( err.includes('too old') ) {
        delete this.watches[watchKey].resourceVersion;
        delete this.watches[watchKey].resourceVersionTime;
        delete this.watches[watchKey].skipResourceVersion;
        this.watch(watchKey);
      }
    }

    super._onmessage(event);
  }
}
