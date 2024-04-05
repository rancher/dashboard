/**
 * Settings to handle server side pagination
 */
export interface PaginationSettings {
  /**
   * Global setting to enable or disable
   */
  enabled: boolean,
  /**
   * Should pagination be enabled for resources in a store
   */
  stores: {
    [name: string]: {
      resources: {
        /**
         * Enable for all resources in this store
         */
        enableAll: boolean,
        enableSome: {
          /**
           * Specific resource type to enable
           */
          enabled: string[],
          /**
           * There's no hardcoded headers or custom list for the resource type, headers will be generated from schema attributes.columns
           */
          generic: boolean,
        },
      }
    }
  }
}
