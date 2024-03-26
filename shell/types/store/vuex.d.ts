// Unfortunately there's no current way to type the vuex store, however we have ts files that references it
// Until we bring that in, this file can contain the interfaces and types used by ts files in place of `any`

/**
 * Generic interface for Vuex getters
 */
export interface VuexStoreGetters {
  [name:string]: Function
}
