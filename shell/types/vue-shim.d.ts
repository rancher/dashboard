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
    $store: VuexStore
  }
}