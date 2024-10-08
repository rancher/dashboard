import { DefineComponent } from 'vue'

declare module '*.vue' {
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * Lookup a given string with the given arguments
     * @param raw if set, do not do HTML escaping.
     */
    t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    }
  }
}
