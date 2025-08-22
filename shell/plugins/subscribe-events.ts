/**
 * Supported events are listed
 *
 * of type { [key: STEVE_WATCH_EVENT]: STEVE_WATCH_EVENT_LISTENER[]}
 */

import { keyForSubscribe } from '@shell/plugins/steve/resourceWatcher';
import { equivalentWatch } from '@shell/plugins/steve/subscribe';
import {
  STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_EVENT_LISTENER, STEVE_WATCH_EVENT_LISTENER_CALLBACK, STEVE_WATCH_EVENT_TYPES_NAMES, STEVE_WATCH_PARAMS
} from '@shell/types/store/subscribe.types';
import myLogger from '@shell/utils/my-logger';

// type SupportedSteveWatchEvents = STEVE_WATCH_EVENT.CHANGES

type GetEventWatcherArgs = {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  params: STEVE_WATCH_PARAMS,
  entryOnly?: boolean,
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

export class SteveWatchEventListenerManager {
  /**
   *
   */
  constructor(storeName: string) {
    // TODO: RC check that this is called on every new store created
    myLogger.warn('SubscribeEvents', storeName);
  }

  /* eslint-disable-next-line no-unused-vars */
  private watches: STEVE_WATCHES = {};

  // private eventWatchers: { [event in SupportedSteveWatchEvents]: STEVE_WATCH_EVENT_LISTENER[]} = { [STEVE_WATCH_EVENT.CHANGES]: [] };
  public readonly supportedEventTypes: STEVE_WATCH_EVENT_TYPES[] = [STEVE_WATCH_EVENT_TYPES.CHANGES];

  isSupportedEventType(type: STEVE_WATCH_EVENT_TYPES): boolean {
    return !!this.supportedEventTypes.includes(type);
  }

  /************************/
  getWatch({ params } : GetEventWatchersArgs): STEVE_WATCH {
    const socketId = keyForSubscribe(params);

    return this.watches[socketId];

    // const events = Object.keys(this.eventWatchers) as STEVE_WATCH_EVENT_NAMES[];

    // for (let i = 0; i < events.length; i++) {
    //   const event = events[i];
    //   const socketId = keyForSubscribe(params);
    //   const eventWatcher: STEVE_WATCH_EVENT_LISTENER | undefined = this.eventWatchers[socketId].find((sl) => equivalentWatch(sl.event, event));
    //   // const eventWatcher: STEVE_WATCH_EVENT_LISTENER | undefined = this.eventWatchers[event].find((sl) => equivalentWatch(sl.params, params));

    //   if (!eventWatcher) {
    //     continue;
    //   }

    //   if (entryOnly || !!Object.keys(eventWatcher?.watchers || {}).length) {
    //     res.push(eventWatcher);
    //   }
    // }

    // return res;
  }

  createWatch({ params }: { params: STEVE_WATCH_PARAMS}): STEVE_WATCH {
    const socketId = keyForSubscribe(params);

    this.watches[socketId] = {
      hasNormalWatch: false,
      listeners:      []
    };

    return this.watches[socketId];
  }

  setWatchStarted({ started, args }: { started: boolean, args: GetEventWatchersArgs}) {
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
      debugger;
    }
    watch.hasNormalWatch = started;
  }

  watchHasListeners({ params }: { params: STEVE_WATCH_PARAMS}): boolean {
    const watch = this.getWatch({ params });

    if (!watch) {
      return false;
    }

    return !!watch.listeners.find((l) => l.callbacks.length);
  }
  /************************/

  /**
     * TODO: RC
     */
  hasEventListener(args: GetEventWatcherArgs) {
    return !!this.getEventListener(args);
  }

  /**
   * TODO: RC
   */
  getEventListener({ event, params, entryOnly }: GetEventWatcherArgs): STEVE_WATCH_EVENT_LISTENER | null {
    // const events = Object.keys(this.eventWatchers) as STEVE_WATCH_EVENT_NAMES[];
    const socketId = keyForSubscribe(params);
    const watches = Object.entries(this.watches);

    for (let i = 0; i < watches.length; i++) {
      const [ewSocketId, watch] = watches[i];

      if (socketId === ewSocketId && watch) {
        const listener = watch.listeners.find((w) => w.event === event);

        if (listener && (entryOnly || !!Object.keys(listener?.callbacks || {}).length)) {
          return listener;
        }
        break;
      }
    }

    return null;

    // for (let i = 0; i < events.length; i++) {
    //   const event = events[i];
    //   const socketId = keyForSubscribe(params);
    //   const eventWatcher: STEVE_WATCH_EVENT_LISTENER | undefined = this.eventWatchers[socketId].find((sl) => equivalentWatch(sl.event, event));
    //   // const eventWatcher: STEVE_WATCH_EVENT_LISTENER | undefined = this.eventWatchers[event].find((sl) => equivalentWatch(sl.params, params));

    //   if (!eventWatcher) {
    //     continue;
    //   }
    //   // TODO: RC needs watchers???
    //   if (entryOnly || !!Object.keys(eventWatcher?.watchers || {}).length) {
    //     return eventWatcher;
    //   }
    // }

    // return null;
  }

  addEventListener({ event, params }: GetEventWatcherArgs): STEVE_WATCH_EVENT_LISTENER | undefined {
    if (!event) {
      return;
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

  triggerEventListener({ event, params }: GetEventWatcherArgs) {
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
  addEventListenerCallback({
    event, params, callback, id
  }: AddEventWatcherArgs): STEVE_WATCH_EVENT_LISTENER {
    const eventWatcher = this.addEventListener({ event, params });

    if (!eventWatcher) {
      throw new Error('TODO: RC');
    }

    if (!eventWatcher.callbacks[id]) {
      eventWatcher.callbacks[id] = callback;
    }

    return eventWatcher;
  }

  removeEventListenerCallback({ event, params, id }: RemoveEventWatcherArgs) {
    // const socketId = keyForSubscribe(params);
    const existing = this.getEventListener({ event, params });
    // const existing = this.eventWatchers[socketId].find((l) => equivalentWatch(l.event, event));

    if (existing) {
      delete existing.callbacks[id];
    }
  }

  removeEventListenderCallbacksOfType() {
    // TODO: RC clear inError / backoff + subscrive events
    // state.inError
  }
}
