/* eslint-disable no-unused-vars */
export enum STEVE_WATCH_MODE {
  DEFAULT = '',
  RESOURCE_CHANGES = 'resource.changes'
}
/* eslint-enable no-unused-vars */

/* eslint-disable no-unused-vars */
export enum STEVE_WATCH_EVENT {
  START = 'resource.start',
  CREATE = 'resource.create',
  CHANGE = 'resource.change',
  CHANGES = 'resource.changes',
  REMOVE = 'resource.resource.remove',
  ERROR = 'resource.error',
  STOP = 'resource.stop',
}
/* eslint-enable no-unused-vars */

export interface STEVE_WATCH_PARAMS {
  type: string,
  selector?: string,
  id?: string,
  revision?: string,
  namespace?: string,
  stop?: boolean,
  force?: boolean,
  mode?: STEVE_WATCH_MODE,
  transient?: boolean,
}

export type STEVE_WATCH_EVENT_LISTENER_ARGS = { forceWatch: boolean }
export type STEVE_WATCH_EVENT_LISTENER_CALLBACK = (args: STEVE_WATCH_EVENT_LISTENER_ARGS) => void
export interface STEVE_WATCH_EVENT_LISTENER {
  params: STEVE_WATCH_PARAMS,
  callbacks: { [id: string]: STEVE_WATCH_EVENT_LISTENER_CALLBACK},
}

export interface STEVE_WATCH_EVENT_PARAMS_COMMON {
  event: STEVE_WATCH_EVENT,
  id: string,
  /**
   * of type @STEVE_WATCH_PARAMS
   */
  params: STEVE_WATCH_PARAMS,
}

export interface STEVE_WATCH_EVENT_PARAMS extends STEVE_WATCH_EVENT_PARAMS_COMMON {
  callback: STEVE_WATCH_EVENT_LISTENER_CALLBACK,
}

export type STEVE_UNWATCH_EVENT_PARAMS = STEVE_WATCH_EVENT_PARAMS_COMMON
