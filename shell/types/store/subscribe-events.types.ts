import { STEVE_WATCH_EVENT_LISTENER_CALLBACK, STEVE_WATCH_EVENT_TYPES_NAMES, STEVE_WATCH_PARAMS } from '@shell/types/store/subscribe.types';

export interface SubscribeEventWatchArgs {
  params: STEVE_WATCH_PARAMS,
}

export interface SubscribeEventListenerArgs extends SubscribeEventWatchArgs {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
}

export interface SubscribeEventCallbackArgs extends SubscribeEventListenerArgs {
  id: string,
}

export interface SubscribeEventListener {
  event: STEVE_WATCH_EVENT_TYPES_NAMES,
  callbacks: { [id: string]: STEVE_WATCH_EVENT_LISTENER_CALLBACK},
}

export type SubscribeEventWatch = {
  hasNormalWatch: boolean,
  listeners: SubscribeEventListener[],
}
