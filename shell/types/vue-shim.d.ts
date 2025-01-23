/* eslint-disable */
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
    $store: {
      getters: Record<string, any>,
      dispatch: (action: string, payload?: any) => Promise<any>,
      commit: (mutation: string, payload?: any) => void,
    }
  }
}
