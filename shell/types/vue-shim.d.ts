/* eslint-disable */
import { VuexStore } from '@shell/types/store/vuex';

// Include the types for the APIs
/// <reference path="../apis/vue-shim.d.ts" />

export {};

declare module 'vue' {
  interface ComponentCustomProperties {
    t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    },
    $t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    },
    $store: VuexStore,
    /**
     * Provided by the `fetch.client` mixin, which `shell/initialize/entry.js`
     * registers globally, so every component has it. Keep in sync with what
     * that mixin writes to its own `state`.
     */
    $fetchState: {
      pending: boolean;
      /** `normalizeError()` output, not an `Error` instance. */
      error: { message: string; statusCode: number } | null;
      timestamp: number;
    }
  }
}