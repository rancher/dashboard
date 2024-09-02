/**
 * Imports in a worker cannot include exports from the file invoking the worker or from files importing the invoking file.
 */

import Socket, {
  NO_WATCH,
  NO_SCHEMA,
  EVENT_CONNECTED,
  REVISION_TOO_OLD
} from '@shell/utils/socket';

export const WATCH_STATUSES = {
  /**
   * watch has been asked for this resource but not request has not successfully been sent
   */
  WATCH_PENDING:    'pending',
  /**
   * requested but not confirmed by the socket yet
   */
  WATCH_REQUESTED:  'requested',
  /**
   * confirmed as active by the socket
   */
  WATCHING:         'watching',
  /**
   * temporarily stopped via message from the socket, a watch should immediately be triggered but the maintenance cycle will pick it up if that doesn't happen.
   */
  STOPPED:          'stopped',
  /**
   * stop has been asked for this resource, but request has not successfully been sent
   */
  REMOVE_PENDING:   'removed_pending',
  /**
   * stop request has been sent to the socket or it's been stopped by the socket itself and is now awaiting a resource.stop message
   */
  REMOVE_REQUESTED: 'removed_requested'
};

export const keyForSubscribe = ({
  resourceType, type, namespace, id, selector
} = {}) => {
  return [(resourceType || type), namespace, id, selector] // each watch param in an array
    .filter((param) => !!param) // filter out all the empty ones // the filter makes these keys neater
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
  WATCH_PENDING, WATCH_REQUESTED, WATCHING, REMOVE_PENDING, REQUESTED_REMOVE
} = WATCH_STATUSES;

export default class ResourceWatcher extends Socket {
  watches = {};
  status = '';
  debugWatcher = false;
  csrf;

  constructor(url, autoReconnect = true, frameTimeout = null, protocol = null, maxTries = null, csrf) {
    super(url, autoReconnect, frameTimeout, protocol, maxTries, true);
    this.baseUrl = self.location.origin + url.replace('subscribe', '');
    this.csrf = csrf;

    this.addEventListener(EVENT_CONNECTED, (e) => {
      this.trace(EVENT_CONNECTED, ': processing previously requested or watched resources');

      Object.values(this.watches).forEach((watch) => {
        const { status, error } = watch;
        const watchKey = keyForSubscribe(watch);

        if ([WATCH_PENDING, WATCH_REQUESTED, WATCHING].includes(status) && !error) {
          this.trace(EVENT_CONNECTED, ': re-watching previously required resource', watchKey, status);
          this.watches[watchKey].status = WATCH_PENDING;
          this.watch(watchKey);
        } else if ([REMOVE_PENDING].includes(status)) {
          this.trace(EVENT_CONNECTED, ': un-watching previously watched resource', watchKey, status);
          this.watches[watchKey].status = REMOVE_PENDING;
          this.unwatch(watchKey);
        }
      });
    });
  }

  trace(...args) {
    this.debugWatcher && console.info('Resource Watcher:', ...args); // eslint-disable-line no-console
  }

  setDebug(on) {
    this.debugWatcher = !!on;
  }

  watchExists(watchKey) {
    return !!this.watches?.[watchKey];
  }

  watch(watchKey, providedResourceVersion, providedResourceVersionTime, providedKeyParts = {}, providedSkipResourceVersion) {
    const {
      resourceType: providedResourceType,
      id: providedId,
      namespace: providedNamespace,
      selector: providedSelector,
      force: providedForce,
    } = providedKeyParts;

    this.trace('watch:', 'requested', watchKey);

    if ([WATCH_REQUESTED, WATCHING].includes(this.watches?.[watchKey]?.status)) {
      this.trace('watch:', 'already requested or watching, aborting', watchKey);

      return;
    }

    if (!providedForce && this.watches?.[watchKey]?.error) {
      if (this.watches?.[watchKey]?.error.reason !== REVISION_TOO_OLD) {
        this.trace('watch:', 'in error, aborting', watchKey);
      }

      return;
    }

    const resourceType = providedResourceType || this.watches?.[watchKey]?.resourceType;
    const id = providedId || this.watches?.[watchKey]?.id;
    const namespace = providedNamespace || this.watches?.[watchKey]?.namespace;
    const selector = providedSelector || this.watches?.[watchKey]?.selector;
    const skipResourceVersion = this.watches?.[watchKey]?.skipResourceVersion || providedSkipResourceVersion;

    const watchObject = {
      resourceType,
      id,
      namespace,
      selector
    };

    const resourceVersionTime = providedResourceVersionTime || this.watches?.[watchKey]?.resourceVersionTime;
    const resourceVersion = providedResourceVersion || this.watches?.[watchKey]?.resourceVersion;

    const success = this.send(JSON.stringify({
      ...watchObject,
      resourceVersion: !skipResourceVersion ? resourceVersion : undefined
    }));

    this.watches[watchKey] = {
      ...watchObject,
      status: success ? WATCH_STATUSES.WATCH_REQUESTED : WATCH_STATUSES.WATCH_PENDING,
      resourceVersion,
      resourceVersionTime,
      skipResourceVersion
    };
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

    if (resourceType && this.watches[watchKey].status !== REQUESTED_REMOVE) {
      const success = this.send(JSON.stringify({
        ...watchObject,
        stop: true
      }));

      this.watches[watchKey].status = success ? REQUESTED_REMOVE : REMOVE_PENDING;
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

    if (eventName === 'resource.start' && this.watches?.[watchKey]?.status === WATCH_REQUESTED) {
      this.watches[watchKey].status = WATCHING;
      delete this.watches[watchKey].error;
    } else if (eventName === 'resource.stop' && this.watches?.[watchKey]) {
      // Find some way to resolve the correct resourceVersion from within the resourceWatcher until then:
      // reset the watch in the resourceWatcher, we'll handle recovery up the chain. For now
      // dispatch the event to the host process which should have a handler for resource.stop

      // if (this.watches?.[watchKey]?.status === REQUESTED_REMOVE) {
      this.watches[watchKey] = { error: this.watches[watchKey]?.error };
      // } else {
      //   this.watches[watchKey].status = STOPPED;
      //   delete this.watches[watchKey].resourceVersion;
      //   delete this.watches[watchKey].resourceVersionTime;
      //   this.watch(watchKey);
      //   this.dispatchEvent(new CustomEvent(EVENT_MESSAGE, { detail: event }));
      // }
    } else if (eventName === 'resource.error') {
      const err = data?.error?.toLowerCase();

      if ( this.watches[watchKey] && err.includes('watch not allowed') ) {
        this.watches[watchKey].error = { type: resourceType, reason: NO_WATCH };
      } else if ( this.watches[watchKey] && err.includes('failed to find schema') ) {
        // This can happen when the cattle-cluster-agent goes down (redeploy deployment, kill pod, etc)
        // The previous method was just to track the error and block any further attempts to watch (canWatch)
        // This method means we can retry on the next findX (should be safe, unless there are other use cases...)

        this.watches[watchKey].error = { type: resourceType, reason: NO_SCHEMA };
      } else if ( err.includes('too old') ) {
        delete this.watches[watchKey].resourceVersion;
        delete this.watches[watchKey].resourceVersionTime;
        delete this.watches[watchKey].skipResourceVersion;
        this.watches[watchKey].error = { type: resourceType, reason: REVISION_TOO_OLD };
        // Needs to match sub resyncWatch params
        this.dispatchEvent(new CustomEvent('resync', {
          detail: {
            data: {
              resourceType, id, namespace, selector
            }
          }
        }));
      }
      this.trace('_onmessage:', 'new error', this.watches[watchKey].error);
    }

    super._onmessage(event);
  }
}
