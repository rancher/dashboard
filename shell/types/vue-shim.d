declare module '*.vue' {
  import Vue from 'vue';
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
      t: (key: string, args?: Record<string, any>, raw?: boolean) => string,
  }
}

declare module 'js-yaml';
