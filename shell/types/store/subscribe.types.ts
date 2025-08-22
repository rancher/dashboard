/* eslint-disable no-unused-vars */
export enum STEVE_WATCH_MODE {
  DEFAULT = '',
  RESOURCE_CHANGES = 'resource.changes'
}
/* eslint-enable no-unused-vars */

/* eslint-disable no-unused-vars */
export enum STEVE_WATCH_EVENT_TYPES {
  START = 'resource.start',
  CREATE = 'resource.create',
  CHANGE = 'resource.change',
  CHANGES = 'resource.changes',
  REMOVE = 'resource.resource.remove',
  ERROR = 'resource.error',
  STOP = 'resource.stop',
}
/* eslint-enable no-unused-vars */

export type STEVE_WATCH_EVENT_TYPES_NAMES = keyof typeof STEVE_WATCH_EVENT_TYPES;

/**
 * The content of the web socket messages sent (and partially received back from) steve
 */
export interface STEVE_WATCH_PARAMS {
  type: string,
  selector?: string,
  id?: string,
  revision?: string,
  namespace?: string,
  stop?: boolean,
  force?: boolean,
  mode?: STEVE_WATCH_MODE
}

export interface STEVE_WATCH_EVENT_PARAMS_COMMON {
  event: STEVE_WATCH_EVENT_TYPES,
  id: string,
  /**
   * of type @STEVE_WATCH_PARAMS
   */
  params: STEVE_WATCH_PARAMS,
}
export type STEVE_WATCH_EVENT_LISTENER_CALLBACK = () => void
export interface STEVE_WATCH_EVENT_PARAMS extends STEVE_WATCH_EVENT_PARAMS_COMMON {
  callback: STEVE_WATCH_EVENT_LISTENER_CALLBACK,
}
export type STEVE_UNWATCH_EVENT_PARAMS = STEVE_WATCH_EVENT_PARAMS_COMMON

export interface STEVE_WATCH_EVENT_LISTENER {
  // params: STEVE_WATCH_PARAMS,
  // watchers: { [id: string]: STEVE_WATCH_EVENT_LISTENER_CALLBACK},
  // hasNormalWatch: boolean,
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  callbacks: { [id: string]: STEVE_WATCH_EVENT_LISTENER_CALLBACK},
}
