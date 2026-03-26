import { K8SResourceType } from './resource-constants';

/**
 * @interface
 * The type of the resource - can be a **string** (for CRDs) or a constant from **{@link K8S}**
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
