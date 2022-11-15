import Socket from '@shell/utils/socket';
import { addParam } from '@shell/utils/url';
import { keyForSubscribe } from '~/shell/plugins/steve/subscribe';

const INSECURE = 'ws://';
const SECURE = 'wss://';

const STATE_DISCONNECTED = 'disconnected';
const STATE_CONNECTING = 'connecting';
const STATE_CONNECTED = 'connected';

export const EVENT_CONNECTING = STATE_CONNECTING;
export const EVENT_CONNECTED = STATE_CONNECTED;
export const EVENT_DISCONNECTED = STATE_DISCONNECTED;
export const EVENT_MESSAGE = 'message';
export const EVENT_FRAME_TIMEOUT = 'frame_timeout';
export const EVENT_CONNECT_ERROR = 'connect_error';
export const EVENT_DISCONNECT_ERROR = 'disconnect_error';

export const NO_WATCH = 'NO_WATCH';
export const NO_SCHEMA = 'NO_SCHEMA';

export const WATCHSTATUSES = {
  PENDING:    'pending', // created but not requested of the socket yet
  REQUESTED:  'requested', // requested but not confirmed by the socket yet
  WATCHING:   'watching', // confirmed as active by the socket
  REFRESHING: 'refreshing', // temporarily stopped while we make a full request to the API, will be rewatched afterwards
  STOPPED:    'stopped', // temporarily stopped via message from the socket, a watch should immediately be triggered but the maintenance cycle will pick it up if that doesn't happen.
  CANCELLED:  'cancelled', // has been flagged to send a stop request to the socket
  REMOVED:    'removed' // stop request has been sent to the socket or it's been stopped by the socket itself and is now awaiting cleanup by the maintenanceInterval
};

export default class ResourceWatcher extends Socket {
  watches = {};
  maintenanceInterval;

  constructor(url, autoReconnect = true, frameTimeout = null, protocol = null, maxTries = null) {
    super(url, autoReconnect, frameTimeout, protocol, maxTries);

    this.maintenanceInterval = setInterval(() => {
      // Every 1 second we:
      if (this.baseUrl) {
        this.syncWatches();
      }
    }, 1000);
  }

  setUrl(url) {
    this.baseUrl = self.location.origin + url.replace('subscribe', '');
    if ( !url.match(/wss?:\/\//) ) {
      url = self.location.origin.replace(/^http/, 'ws') + url;
    }

    if ( self.location.protocol === 'https:' && url.startsWith(INSECURE) ) {
      url = SECURE + url.substr(INSECURE.length);
    }

    this.url = url;
  }

  // refactoring this to use new specific methods for subscribing and unsubscribing to resource collections which will make recovering stopped subscriptions a little bit easier.
  send(data) {
    // we're going to use these values from the data we're sending to determine if we're subscribing or unsubscribing
    if (data.resourceType) {
      const {
        resourceType, namespace, id, selector, resourceVersion, resourceVersionTime = Date.now(), stop = false
      } = JSON.parse(data);

      const watchObject = {
        resourceType,
        id,
        namespace,
        selector
      };
      const watchKey = keyForSubscribe(watchObject);

      if (!this.watches?.[watchKey]) {
        this.watches[watchKey] = {
          ...watchObject,
          status: WATCHSTATUSES.PENDING,
          resourceVersion,
          resourceVersionTime
        };
      }

      if (!stop && resourceVersion) {
        this.watch(watchKey, resourceVersion, resourceVersionTime, {
          resourceType, id, namespace, selector
        });
      } else if (stop) {
        this.unwatch(watchKey);
      }

      return true;
    }

    // keeping this primarily for websockets used for consoles
    if ( this.socket && this.state === STATE_CONNECTED ) {
      this.socket.send(data);

      return true;
    }

    return false;
  }

  async watch(watchKey, providedResourceVersion, providedResourceVersionTime = Date.now(), providedKeyParts = {}) {
    const {
      PENDING, REQUESTED, WATCHING, REFRESHING
    } = WATCHSTATUSES;
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
    const resourceStatus = this.watches?.[watchKey]?.status;
    const resourceUrl = this.baseUrl + resourceType;
    const limitedResourceUrl = addParam(resourceUrl, 'limit', 1);
    const opt = {
      method:  'get',
      headers: { accept: 'application/json' }
    };
    const watchObject = {
      resourceType,
      id,
      namespace,
      selector
    };

    let resourceVersionTime = providedResourceVersionTime || this.watches?.[watchKey]?.resourceVersionTime;
    let resourceVersion = providedResourceVersion || this.watches?.[watchKey]?.resourceVersion;

    if (!resourceVersion || Date.now() - resourceVersionTime > 300000) { // 300000ms is 5minutes
      await fetch(limitedResourceUrl, opt)
        .then((res) => {
          if (!res.ok) {
            this.watches[watchKey].error = res.json();
            console.warn(`Resource error retrieving resourceVersion`, resourceType, ':', res.json()); // eslint-disable-line no-console
          }

          return res.json();
        })
        .then((res) => {
          resourceVersionTime = Date.now();
          resourceVersion = res.revision;
        });
    }

    if (![PENDING, REQUESTED, WATCHING, REFRESHING].includes(resourceStatus)) {
      this.watches[watchKey] = {
        ...watchObject,
        status: WATCHSTATUSES.PENDING,
        resourceVersion,
        resourceVersionTime
      };
    }
  }

  unwatch(watchKey) {
    if (this.watches?.[watchKey]) {
      this.watches[watchKey] = { ...this.watches[watchKey], status: WATCHSTATUSES.CANCELLED };
    }
  }

  syncWatches() {
    const watchesArray = Object.values(this.watches); // convert to array
    const {
      PENDING, REQUESTED, WATCHING, REFRESHING, REMOVED, CANCELLED
    } = WATCHSTATUSES;

    if (this.isConnected()) {
      watchesArray
        .forEach((watch) => {
          const {
            resourceType, id, namespace, selector, resourceVersion, status
          } = watch;
          const watchObject = {
            resourceType,
            id,
            namespace,
            selector
          };
          const watchKey = keyForSubscribe(watchObject);

          if (status === PENDING) {
            this.socket.send(JSON.stringify({
              ...watchObject,
              resourceVersion
            }));
            this.watches[watchKey].status = REQUESTED;
          } else if (watch.status === CANCELLED) {
            this.socket.send(JSON.stringify({
              ...watchObject,
              stop: true
            }));
            this.watches[watchKey].status = REMOVED;
          }
        });

      // get rid of all of the removed watches
      watchesArray
        .filter(watch => watch.status === REMOVED)
        .forEach((watch) => {
          delete this.watches[keyForSubscribe(watch)];
        });
    } else if (this.isConnecting()) {
      watchesArray
        .forEach((watch) => {
          const { status } = watch;
          const watchKey = keyForSubscribe(watch);

          if ([PENDING, REQUESTED, WATCHING, REFRESHING].includes(status)) {
            this.watch(watchKey);
          } else {
            this.watch[watchKey].status = REMOVED;
          }
        });
    }
  }

  isConnecting() {
    return this.state === STATE_CONNECTING;
  }

  _onmessage(event) {
    const {
      REQUESTED, WATCHING, STOPPED, CANCELLED, REMOVED
    } = WATCHSTATUSES;

    const {
      name: eventName, resourceType, id, namespace, selector, data
    } = event.data;
    const watchKey = keyForSubscribe({
      resourceType,
      id,
      namespace,
      selector
    });

    this._resetWatchdog();
    this.tries = 0;
    this.framesReceived++;

    if (eventName === 'resource.start' && this.watches?.[watchKey]?.status === REQUESTED) {
      this.watches[watchKey].status = WATCHING;
    } else if (eventName === 'resource.stop' && this.watches?.[watchKey] && ![CANCELLED, REMOVED].includes(this.watches?.[watchKey]?.status)) {
      this.watches[watchKey].status = STOPPED;
      delete this.watches[watchKey].resourceVersion;
      delete this.watches[watchKey].resourceVersionTime;
      this.watch(watchKey);
    } else if (eventName === 'resource.error') {
      const err = data?.error?.toLowerCase();

      if ( this.watches[watchKey] && err.includes('watch not allowed') ) {
        this.watches[watchKey].error = { type: resourceType, reason: NO_WATCH };
        this.unwatch(watchKey);
      } else if ( this.watches[watchKey] && err.includes('failed to find schema') ) {
        this.watches[watchKey].error = { type: resourceType, reason: NO_SCHEMA };
        this.unwatch(watchKey);
      } else if ( err.includes('too old') ) {
        this.watch(watchKey);
      }
    }

    this.dispatchEvent(new CustomEvent(EVENT_MESSAGE, { detail: event }));
  }
}
