// Unfortunately there's no current way to type the vuex store, however we have ts files that references it
// Until we bring that in, this file can contain the interfaces and types used by ts files in place of `any`

/**
 * Generic interface for Vuex getters
 */
export interface VuexStoreGetters {
  [name:string]: Function | any
}

export interface VuexStore {
  getters: VuexStoreGetters,
  dispatch: any,

  // When we have exact properties above we can remove below
  [name:string]: any
}
