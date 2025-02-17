export enum STEVE_WATCH_MODE {
  DEFAULT = '',
  RESOURCE_CHANGES = 'resource.changes'
}

export enum STEVE_WATCH_EVENT {
  START = 'resource.start',
  CREATE = 'resource.create',
  CHANGE = 'resource.change',
  CHANGES = 'resource.changes',
  REMOVE = 'resource.resource.remove',
  ERROR = 'resource.error',
  STOP = 'resource.stop',
}

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

export type STEVE_WATCH_EVENT_LISTENER_CALLBACK = () => void
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
