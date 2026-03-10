import { K8SResourceType } from './resource-constants';

/**
 * The type of the resource - can be a string (for CRDs) or a constant from K8S
 *
 * @example
 * ```ts
 * import { K8S } from '@shell/apis';
 *
 * // Using constants (recommended)
 * resources.cluster.list(K8S.POD);
 *
 * // Using strings (for CRDs or dynamic resources)
 * resources.cluster.list('mycompany.io.customresource');
 * ```
 */
export type ResourceType = K8SResourceType | string;

/**
 * Base interface for all resource objects returned from the API
 */
export interface ResourceBase {
  id?: string;
  type?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    uid?: string;
    resourceVersion?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  [key: string]: any;
}
