// eslint-disable-next-line no-unused-vars
import Vue, { ComponentCustomProperties } from 'vue';
declare module '*.vue' {
  export default Vue;
}

// This is required to keep typescript from complaining. It is required for
// our i18n plugin. For more info see:
// https://v2.vuejs.org/v2/guide/typescript.html?redirect=true#Augmenting-Types-for-Use-with-Plugins
declare module 'vue/types/vue' {
  // eslint-disable-next-line no-unused-vars
  interface Vue {
      /**
       * Lookup a given string with the given arguments
       * @param raw if set, do not do HTML escaping.
       */
      t: {
        (key: string, args?: Record<string, any>, raw?: boolean): string;
        (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
      };
  }
}

declare module '@vue/runtime-core' {
  // eslint-disable-next-line no-unused-vars
  interface Vue {
    t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    }
  }

  // eslint-disable-next-line no-unused-vars
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

declare module 'js-yaml';
