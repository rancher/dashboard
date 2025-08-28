/**
 * Supported events are listed
 *
 * of type { [key: STEVE_WATCH_EVENT]: STEVE_WATCH_EVENT_LISTENER[]}
 */

import { keyForSubscribe } from '@shell/plugins/steve/resourceWatcher';
import {
  STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_EVENT_LISTENER, STEVE_WATCH_EVENT_LISTENER_CALLBACK, STEVE_WATCH_EVENT_TYPES_NAMES, STEVE_WATCH_PARAMS
} from '@shell/types/store/subscribe.types';
import myLogger from '@shell/utils/my-logger';

type GetEventWatcherArgs = {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  params: STEVE_WATCH_PARAMS,
  entryOnly?: boolean,
  hasCallbacks?: boolean,
}

type GetEventWatchersArgs = {
  params: STEVE_WATCH_PARAMS,
  entryOnly?: boolean,
}

type AddEventWatcherArgs = {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  params: STEVE_WATCH_PARAMS,
  callback: STEVE_WATCH_EVENT_LISTENER_CALLBACK,
  id: string,
}

type RemoveEventWatcherArgs = {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  params: STEVE_WATCH_PARAMS,
  id: string,
}

type STEVE_WATCH = {
  hasNormalWatch: boolean,
  listeners: STEVE_WATCH_EVENT_LISTENER[],
}
type STEVE_WATCHES = { [socketId: string]: STEVE_WATCH};

/**
 * For a specific resource watch, listen for a specific event type and trigger callback when received
 *
 * For example, listen for provisioning.cattle.io clusters messages of type resource.changes and trigger callback when received
 *
 * // TODO: RC refactor SteveSocketMessageListener
 * Watch - UI is watching a resource type restricted by nothing/id/namespace/selector
 * // TODO: RC refactor event --> message
 * Event - Rancher socket message to ui
 * Listener - listen to events, trigger when received
 */
export class SteveWatchEventListenerManager {
  constructor(storeName: string) {
    // TODO: RC remove
    myLogger.warn('sub', 'event', 'ctor', storeName);
  }

  private keyForSubscribe({ params }: {params: STEVE_WATCH_PARAMS}): string {
    const socketId = keyForSubscribe(params);

    // return `${ socketId }mode=${ params.mode }`;
    return socketId;
  }

  /**
   * collection of ui --> rancher watches. we keep state specific to this class here
   */
  /* eslint-disable-next-line no-unused-vars */
  private watches: STEVE_WATCHES = {};

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

  /************************/
  /**
   * Get the watch for the given params
   */
  public getWatch({ params } : GetEventWatchersArgs): STEVE_WATCH {
    const socketId = this.keyForSubscribe({ params });

    return this.watches[socketId];
  }

  /**
   * Create a watch for the given params
   */
  private createWatch({ params }: { params: STEVE_WATCH_PARAMS}): STEVE_WATCH {
    const socketId = this.keyForSubscribe({ params });

    this.watches[socketId] = {
      hasNormalWatch: false,
      listeners:      []
    };

    return this.watches[socketId];
  }

  private deleteWatch({ params } : GetEventWatchersArgs) {
    const socketId = this.keyForSubscribe({ params });

    delete this.watches[socketId];
  }

  public hasNormalWatch({ params } : GetEventWatchersArgs): boolean {
    const socketId = this.keyForSubscribe({ params });

    return this.watches[socketId]?.hasNormalWatch;
  }

  /**
   * TODO: RC description
   */
  public setWatchStarted({ started, args }: { started: boolean, args: GetEventWatchersArgs}) {
    const { params } = args;

    let watch = this.getWatch({ params });

    if (!watch) {
      if (!started) {
        // no point setting a non-existent watch as not started
        return;
      }
      watch = this.createWatch({ params });
    }

    //  && args.params.type === 'management.cattle.io.cluster'
    if (started) {
      // debugger; TODO: RC
    }
    if ( params.resourceType === 'management.cattle.io.cluster') {
      myLogger.warn('sub', 'event', 'setWatchStarted', 'hasNormalWatch', started, params );
    }

    watch.hasNormalWatch = started;

    // is watch empty
    if (!watch.hasNormalWatch && watch.listeners.length === 0) {
      this.deleteWatch({ params });
    }
  }

  /**
   * TODO: RC description
   */
  public watchHasListeners({ params }: { params: STEVE_WATCH_PARAMS}): boolean {
    const watch = this.getWatch({ params });

    if (!watch) {
      return false;
    }

    return !!watch.listeners.find((l) => l.callbacks.length);
  }
  /************************/

  // TODO: RC refactor GetEventWatcherArgs has multi uses
  /**
   * TODO: RC description
   */
  public hasEventListener(args: GetEventWatcherArgs) {
    return !!this.getEventListener(args);
  }

  public hasEventListeners({ params }: GetEventWatcherArgs): boolean {
    const socketId = this.keyForSubscribe({ params });
    const watch = this.watches[socketId];
    const listener = watch?.listeners.find((w) => Object.values(w.callbacks).length > 0);

    return !!listener;

    // const watches = Object.entries(this.watches);

    // for (let i = 0; i < watches.length; i++) {
    //   const [ewSocketId, watch] = watches[i];

    //   if (socketId === ewSocketId && watch) {
    //     const listener = watch.listeners.find((w) => Object.values(w.callbacks).length > 0);

    //     if (listener) {
    //       return true;
    //     }
    //   }
    // }

    // return false;
  }

  /**
   * TODO: RC description
   */
  public getEventListener({
    event, params, entryOnly, hasCallbacks
  }: GetEventWatcherArgs): STEVE_WATCH_EVENT_LISTENER | null {
    const socketId = this.keyForSubscribe({ params });
    const watch = this.watches[socketId];

    if (watch) {
      const listener = watch.listeners.find((w) => w.event === event);

      if (listener && (entryOnly || !!Object.keys(listener?.callbacks || {}).length)) {
        return listener;
      }
    }

    // const watches = Object.entries(this.watches);

    // for (let i = 0; i < watches.length; i++) {
    //   const [ewSocketId, watch] = watches[i];

    //   if (socketId === ewSocketId && watch) {
    //     const listener = watch.listeners.find((w) => w.event === event);

    //     if (listener && (entryOnly || !!Object.keys(listener?.callbacks || {}).length)) {
    //       return listener;
    //     }
    //     break;
    //   }
    // }

    return null;
  }

  /**
   * TODO: RC description
   */
  public addEventListener({ event, params }: GetEventWatcherArgs): STEVE_WATCH_EVENT_LISTENER {
    if (!event) {
      throw new Error(`Cannot add a socket watch event listener if there's no event to listen to`);
    }

    let watch = this.getWatch({ params });

    if (!watch) {
      watch = this.createWatch({ params });
    }

    let listener = this.getEventListener({
      event, params, entryOnly: true
    });

    if (!listener) {
      listener = {
        event,
        callbacks: { },
      };
      watch.listeners.push(listener);
    }

    return listener;
  }

  /**
   * TODO: RC description
   */
  public triggerEventListener({ event, params }: GetEventWatcherArgs) {
    const eventWatcher = this.getEventListener({
      event, params, entryOnly: false
    });

    if (eventWatcher) {
      Object.values(eventWatcher.callbacks).forEach((cb) => {
        if (!cb) {
          debugger;
        }
        cb();
      });
    }
  }

  /************************/
  /**
   * TODO: RC description
   */
  public addEventListenerCallback({
    event, params, callback, id
  }: AddEventWatcherArgs): STEVE_WATCH_EVENT_LISTENER {
    const eventWatcher = this.addEventListener({ event, params });

    if (!eventWatcher.callbacks[id]) {
      eventWatcher.callbacks[id] = callback;
    }

    return eventWatcher;
  }

  /**
   * TODO: RC description
   */
  public removeEventListenerCallback({ event, params, id }: RemoveEventWatcherArgs) {
    const existing = this.getEventListener({ event, params });

    if (existing) {
      delete existing.callbacks[id];
    }
  }

  /**
   * TODO: RC description
   */
  public removeEventListenerCallbacksOfType() {
    // TODO: RC clear inError / backoff + subscrive events
    // state.inError
  }
}
