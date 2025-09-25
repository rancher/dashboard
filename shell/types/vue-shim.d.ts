/* eslint-disable */
import type ShellApi from '@shell/plugins/internal-api/shell/shell.api';
import { VuexStore } from '@shell/types/store/vuex';

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
    $shell: ShellApi,
  }
}
