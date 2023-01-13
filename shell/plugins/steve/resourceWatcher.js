/**
 * Imports in a worker cannot include exports from the file invoking the worker or from files importing the invoking file.
 */

import Socket, {
  NO_WATCH,
  NO_SCHEMA,
  EVENT_MESSAGE,
  EVENT_CONNECTED,
} from '@shell/utils/socket';
import { addParam } from '@shell/utils/url';

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
  WATCH_PENDING, WATCH_REQUESTED, WATCHING, STOPPED, REMOVE_PENDING, REQUESTED_REMOVE
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

  async watch(watchKey, providedResourceVersion, providedResourceVersionTime, providedKeyParts = {}, providedSkipResourceVersion) {
    const {
      resourceType: providedResourceType,
      id: providedId,
      namespace: providedNamespace,
      selector: providedSelector
    } = providedKeyParts;

    this.trace('watch:', 'requested', watchKey);

    if ([WATCH_REQUESTED, WATCHING].includes(this.watches?.[watchKey]?.status)) {
      this.trace('watch:', 'already requested or watching, aborting', watchKey);

      return;
    }

    if (this.watches?.[watchKey]?.error) {
      this.trace('watch:', 'in error, aborting', watchKey);

      return;
    }

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
      this.trace('watch:', 'revision update required', watchKey);

      const resourceUrl = this.baseUrl + resourceType;
      const limitedResourceUrl = addParam(resourceUrl, 'limit', 1);
      const opt = {
        method:  'get',
        headers: { accept: 'application/json' },
      };

      if (this.csrf) {
        opt.headers['x-api-csrf'] = this.csrf;
      }

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
      // When this fails we should re-fetch all resources (aka same as resyncWatch, or we actually call it). #7917
      // This would match the old approach
    }

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
    } else if (eventName === 'resource.stop' && this.watches?.[watchKey]) {
      if (this.watches?.[watchKey]?.status === REQUESTED_REMOVE) {
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
      } else if ( this.watches[watchKey] && err.includes('failed to find schema') ) {
        // This can happen when the cattle-cluster-agent goes down (redeploy deployment, kill pod, etc)
        // The previous method was just to track the error and block any further attempts to watch (canWatch)
        // This method means we can retry on the next findX (should be safe, unless there are other use cases...)

        this.watches[watchKey].error = { type: resourceType, reason: NO_SCHEMA };
      } else if ( err.includes('too old') ) {
        // We don't actually know the gap between the requested revision and the oldest available revision.
        // For this case we should re-fetch all resources (aka same as resyncWatch, or we actually call it). #7917
        // This would match the old approach
        delete this.watches[watchKey].resourceVersion;
        delete this.watches[watchKey].resourceVersionTime;
        delete this.watches[watchKey].skipResourceVersion;
        this.watch(watchKey);
      }
    }

    super._onmessage(event);
  }
}
