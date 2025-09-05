import { STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_EVENT_TYPES_NAMES, STEVE_WATCH_PARAMS } from '@shell/types/store/subscribe.types';

/**
 * Common params used when a watcher adds or removes a listener to a watch
 */
export interface STEVE_WATCH_EVENT_PARAMS_COMMON {
  event: STEVE_WATCH_EVENT_TYPES,
  id: string,
  /**
   * of type @STEVE_WATCH_PARAMS
   */
  params: STEVE_WATCH_PARAMS,
}

/**
 * Executes when a watch event has a listener and it's triggered
 */
export type STEVE_WATCH_EVENT_LISTENER_CALLBACK = () => void

/**
 * Common params used when a watcher adds a listener to a watch
 */
export interface STEVE_WATCH_EVENT_PARAMS extends STEVE_WATCH_EVENT_PARAMS_COMMON {
  callback: STEVE_WATCH_EVENT_LISTENER_CALLBACK,
}

/**
 * Common params used when a watcher removes a listener from a watch
 */
export type STEVE_UNWATCH_EVENT_PARAMS = STEVE_WATCH_EVENT_PARAMS_COMMON

/**
 * Common properties for identifying a subscribe watcher
 */
export interface SubscribeEventWatchArgs {
  params: STEVE_WATCH_PARAMS,
}

/**
 * Common properties for identifying a subscribe watcher's listeners
 */
export interface SubscribeEventListenerArgs extends SubscribeEventWatchArgs {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
}

/**
 * Common properties for identifying a subscribe watcher's listener
 */
export interface SubscribeEventCallbackArgs extends SubscribeEventListenerArgs {
  id: string,
}

/**
 * Represents a subscribe watcher listener
 */
export interface SubscribeEventListener {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  callbacks: { [id: string]: STEVE_WATCH_EVENT_LISTENER_CALLBACK},
}

/**
 * Represents a subscribe watcher
 */
export type SubscribeEventWatch = {
  /**
   * is there a standard non-listener watch for this type (i.e. vanilla watch)
   */
  hasStandardWatch: boolean,
  listeners: SubscribeEventListener[],
}
