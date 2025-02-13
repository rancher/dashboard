export enum STEVE_WATCH_MODES {
  DEFAULT = '',
  RESOURCE_CHANGES = 'resource.changes'
}

export const STEVE_WATCH_EVENTS = {
  START:   'resource.start',
  CREATE:  'resource.create',
  CHANGE:  'resource.change',
  CHANGES: 'resource.changes',
  REMOVE:  'resource.resource.remove',
  ERROR:   'resource.error',
  STOP:    'resource.stop',
};

export interface STEVE_WATCH_PARAMS {
  type: string,
  selector?: string,
  id?: string,
  revision?: string,
  namespace?: string,
  stop?: boolean,
  force?: boolean,
  mode?: STEVE_WATCH_MODES
}

export type STEVE_LISTENER_CALLBACK = () => void
export interface STEVE_LISTENER {
  params: STEVE_WATCH_PARAMS,
  callbacks: { [id: string]: STEVE_LISTENER_CALLBACK},
}
