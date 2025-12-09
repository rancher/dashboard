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

export type STEVE_WATCH_EVENT_TYPES_NAMES = `${ STEVE_WATCH_EVENT_TYPES }`;

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
  forceWatch?: boolean,
  mode?: STEVE_WATCH_MODE
}
