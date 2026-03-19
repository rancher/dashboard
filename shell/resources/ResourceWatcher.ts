import type { VuexStore } from '@shell/types/store/vuex';
import type { STEVE_WATCH_EVENT_LISTENER_CALLBACK_PARAMS } from '@shell/types/store/subscribe-events.types';
import { STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_MODE } from '@shell/types/store/subscribe.types';

let nextWatchId = 1;

/**
 * Manages a websocket watch subscription for a single resource type.
 *
 * Handles starting, stopping and event dispatch. Emits dev-only
 * console messages for debugging.
 */
export class ResourceWatcher {
  readonly watchId: string;
  readonly resourceType: string;

  private $store: VuexStore;
  private storeName: string;
  private watching = false;
  private disposed = false;
  private onChange: () => void;

  constructor($store: VuexStore, storeName: string, resourceType: string, onChange: () => void) {
    this.$store = $store;
    this.storeName = storeName;
    this.resourceType = resourceType;
    this.onChange = onChange;
    this.watchId = `rw-${ resourceType }-${ nextWatchId++ }`;
  }

  get isWatching(): boolean {
    return this.watching;
  }

  start(): void {
    if (this.watching || this.disposed) {
      return;
    }

    this.watching = true;

    if (process.env.dev) {
      console.info(`[ResourceWatcher:${ this.watchId }] starting watch for ${ this.resourceType }`); // eslint-disable-line no-console
    }

    this.$store.dispatch(`${ this.storeName }/watchEvent`, {
      event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
      id:     this.watchId,
      params: {
        type: this.resourceType,
        mode: STEVE_WATCH_MODE.RESOURCE_CHANGES,
      },
      callback: (params: STEVE_WATCH_EVENT_LISTENER_CALLBACK_PARAMS) => this.onEvent(params),
    });
  }

  stop(): void {
    if (!this.watching) {
      return;
    }

    if (process.env.dev) {
      console.info(`[ResourceWatcher:${ this.watchId }] stopping watch for ${ this.resourceType }`); // eslint-disable-line no-console
    }

    this.watching = false;

    this.$store.dispatch(`${ this.storeName }/unwatchEvent`, {
      event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
      id:     this.watchId,
      params: {
        type: this.resourceType,
        mode: STEVE_WATCH_MODE.RESOURCE_CHANGES,
      },
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.stop();
  }

  private onEvent(params: STEVE_WATCH_EVENT_LISTENER_CALLBACK_PARAMS): void {
    if (this.disposed) {
      return;
    }

    if (process.env.dev) {
      console.info(`[ResourceWatcher:${ this.watchId }] event received`, params); // eslint-disable-line no-console
    }

    this.onChange();
  }
}
