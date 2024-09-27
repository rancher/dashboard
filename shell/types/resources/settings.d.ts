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
