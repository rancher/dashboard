
export interface PaginationSettingsStore {
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
        enabled: (string | { resource: string, context: string[]})[],
        /**
         * There's no hardcoded headers or custom list for the resource type, headers will be generated from schema attributes.columns
         */
        generic: boolean,
      },
    }
  }
}

/*
 * Determine which resources can utilise server-side pagination
 */
export interface PaginationSettingsStores {
  [store: string]: PaginationSettingsStore
}

/**
 * Names of pagination features used in pagination settings (not featureflags)
 */
export type PaginationFeatureName = 'listAutoRefreshToggle' | 'listManualRefresh' | 'homePageCluster'

export type PaginationFeatureHomePageClusterConfig = {
  threshold: number,
  results: number,
  pagesPerRow: number
}

/**
 * Details of a specific pagination feature
 */
export type PaginationFeature<Config = any> = {
  version: number,
  enabled: boolean,
  configuration?: Config,
}

/**
 * List of specific features that can be enabled / disabled
 */
export type PaginationSettingsFeatures = {
  [key in PaginationFeatureName]?: PaginationFeature // eslint-disable-line no-unused-vars
}

/**
 * Settings to handle server side pagination
 */
export interface PaginationSettings {
  /**
   * Override `stores` and apply pagination to a set of default resource types that can change between versions
   */
  useDefaultStores: boolean,
  /**
   * Should pagination be enabled for resources in a store
   */
  stores?: PaginationSettingsStore,

  /**
   * List of specific features that can be enabled / disabled
   */
  features?: PaginationSettingsFeatures,

  /**
   * Debounce the amount of time between a resource changing and the backend sending a resource.changes message
   *
   * This greatly reduces spam in systems with high resource churn. It needs to be more than it takes for the UI to make a http request to fetch changes
   */
  resourceChangesDebounceMs?: number
}

type Links = {
  remove: string;
  self: string;
  update: string;
  view: string;
};

type FieldsV1 = {
  'f:customized': {};
  'f:default': {};
  'f:source': {};
  'f:value': {};
};

type ManagedFields = {
  apiVersion: string;
  fieldsType: string;
  fieldsV1: FieldsV1;
  manager: string;
  operation: string;
  time: string;
};

// Note - this should now be @RancherKubeMetadata
type Metadata = {
  creationTimestamp: string;
  fields: string[];
  generation: number;
  managedFields: ManagedFields[];
  name: string;
  relationships: null;
  resourceVersion: string;
  state: {
    error: boolean;
    message: string;
    name: string;
    transitioning: boolean;
  };
  uid: string;
};

export type Setting = {
  id: string;
  type: string;
  links: Links;
  apiVersion: string;
  customized: boolean;
  default: string;
  kind: string;
  metadata: Metadata;
  source: string;
  value: string | null;
  save: () => void;
};
