import { keyForSubscribe } from '@shell/plugins/steve/resourceWatcher';
import {
  SubscribeEventListener, SubscribeEventCallbackArgs, SubscribeEventListenerArgs, SubscribeEventWatch, SubscribeEventWatchArgs,
  STEVE_WATCH_EVENT_LISTENER_CALLBACK
} from '@shell/types/store/subscribe-events.types';
import { STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_PARAMS } from '@shell/types/store/subscribe.types';

type SubscribeEventWatches = { [socketId: string]: SubscribeEventWatch};

/**
 * For a specific resource watch, listen for a specific event type and trigger callback when received
 *
 * For example, listen for provisioning.cattle.io clusters messages of type resource.changes and trigger callback when received
 *
 * Watch - UI is watching a resource type restricted by nothing/id/namespace/selector. For example
 * - watch all pods
 * - watch specific pod
 * - watch pods with specific labels
 * Event - Rancher socket messages TO the ui. For example
 * - resource.started
 * - resource.change
 * - resource.changes
 * Listener - listen to events, trigger when received. For example
 * - listen for resource.changes messages for the all pods watch
 * Callback - triggered when a listener has heard something
 * - watch for all pods receives a resource.changes message, it has a listener, listener executes it's callback
 *
 * Watch 0:M Events 0:M Listeners 0:M Callbacks
 */
export class SteveWatchEventListenerManager {
  private keyForSubscribe({ params }: {params: STEVE_WATCH_PARAMS}): string {
    return keyForSubscribe(params);
  }

  /**
   * collection of ui --> rancher watches. we keep state specific to this class here
   */
  private watches: SubscribeEventWatches = {};

  /**
   * Not all event types can be listened to are supported, only these
   */
  public readonly supportedEventTypes: STEVE_WATCH_EVENT_TYPES[] = [STEVE_WATCH_EVENT_TYPES.CHANGES];

  /**
   * Not all event types can be listened to are supported, check if one is
   */
  public isSupportedEventType(type: STEVE_WATCH_EVENT_TYPES): boolean {
    return !!this.supportedEventTypes.includes(type);
  }

  /** **** Watches ***********************/

  public getWatch({ params } : SubscribeEventWatchArgs): SubscribeEventWatch {
    const socketId = this.keyForSubscribe({ params });

    return this.watches[socketId];
  }

  private initialiseWatch({ params }: SubscribeEventWatchArgs): SubscribeEventWatch {
    const socketId = this.keyForSubscribe({ params });

    this.watches[socketId] = {
      hasStandardWatch: false,
      listeners:        []
    };

    return this.watches[socketId];
  }

  /**
   * This is just tidying the entry
   *
   * All watches associated with this type should be unwatched
   */
  private deleteWatch({ params } : SubscribeEventWatchArgs) {
    const socketId = this.keyForSubscribe({ params });

    delete this.watches[socketId];
  }

  /**
   * Is there a standard non-listener watch for this this type
   */
  public hasStandardWatch({ params } : SubscribeEventWatchArgs): boolean {
    const socketId = this.keyForSubscribe({ params });

    return this.watches[socketId]?.hasStandardWatch;
  }

  /**
   * Set if this type has a standard non-listener watch associated with it
   */
  public setStandardWatch({ standardWatch, args }: { standardWatch: boolean, args: SubscribeEventWatchArgs}) {
    const { params } = args;

    let watch = this.getWatch({ params });

    if (!watch) {
      if (!standardWatch) {
        // no point setting a non-existent watch as not started
        return;
      }
      watch = this.initialiseWatch({ params });
    }

    watch.hasStandardWatch = standardWatch;

    // if we've just set this to false and there's no listeners, tidy up the entry
    if (!watch.hasStandardWatch && watch.listeners.length === 0) {
      this.deleteWatch({ params });
    }
  }

  /** **** Listeners ***********************/

  public hasEventListeners({ params }: SubscribeEventWatchArgs): boolean {
    const socketId = this.keyForSubscribe({ params });
    const watch = this.watches[socketId];
    const listener = watch?.listeners.find((l) => Object.values(l.callbacks).length > 0);

    return !!listener;
  }

  public getEventListener({ entryOnly, args }: { entryOnly?: boolean, args: SubscribeEventListenerArgs}): SubscribeEventListener | null {
    const { params, event } = args;
    const socketId = this.keyForSubscribe({ params });
    const watch = this.watches[socketId];

    if (watch) {
      const listener = watch.listeners.find((w) => w.event === event);

      if (listener && (entryOnly || !!Object.keys(listener?.callbacks || {}).length)) {
        return listener;
      }
    }

    return null;
  }

  public addEventListener({ event, params }: SubscribeEventListenerArgs): SubscribeEventListener {
    if (!event) {
      throw new Error(`Cannot add a socket watch event listener if there's no event to listen to`);
    }

    let watch = this.getWatch({ params });

    if (!watch) {
      watch = this.initialiseWatch({ params });
    }

    let listener = this.getEventListener({ entryOnly: true, args: { event, params } });

    if (!listener) {
      listener = {
        event,
        callbacks: { },
      };
      watch.listeners.push(listener);
    }

    return listener;
  }

  public triggerEventListener({ event, params }: SubscribeEventListenerArgs) {
    const eventWatcher = this.getEventListener({ entryOnly: false, args: { event, params } });

    if (eventWatcher) {
      Object.values(eventWatcher.callbacks).forEach((cb) => {
        cb({ forceWatch: params.forceWatch, revision: params.revision }); // eslint-disable-line node/no-callback-literal
      });
    }
  }

  public triggerAllEventListeners({ params }: SubscribeEventWatchArgs) {
    const watch = this.getWatch({ params });

    watch.listeners.forEach((l) => {
      Object.values(l.callbacks || {}).forEach((cb) => {
        cb({ forceWatch: params.forceWatch, revision: params.revision });// eslint-disable-line node/no-callback-literal
      });
    });
  }

  /** **** Callbacks ***********************/

  public addEventListenerCallback({ callback, args }: {
    callback: STEVE_WATCH_EVENT_LISTENER_CALLBACK,
    args: SubscribeEventCallbackArgs
  }): SubscribeEventListener {
    const { params, event, id } = args;
    const eventWatcher = this.addEventListener({ event, params });

    if (!eventWatcher.callbacks[id]) {
      eventWatcher.callbacks[id] = callback;
    }

    return eventWatcher;
  }

  /**
   * This is just tidying the entry
   *
   * All watches associated with this type should be unwatched
   */
  public removeEventListenerCallback({ event, params, id }: SubscribeEventCallbackArgs) {
    const existing = this.getEventListener({ args: { event, params } });

    if (existing) {
      delete existing.callbacks[id];
    }
  }
}
