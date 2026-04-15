import { K8SResourceType } from './resource-constants';
import {
  ActionFindAllArgs, ActionFindArgs,
  ActionFindPageArgs, ActionFindMatchingArgs
} from '@shell/types/store/dashboard-store.types';

/**
 * @interface
 * The type of the resource - can be a **string** (for CRDs) or a constant from **{@link K8S}**
 *
 * @example
 * ```ts
 * import { K8S } from '@shell/apis';
 *
 * // Using constants (recommended)
 * resources.cluster.findFiltered(K8S.POD);
 *
 * // Using strings (for CRDs or dynamic resources)
 * resources.cluster.findFiltered('mycompany.io.customresource');
 * ```
 */
export type ResourceType = K8SResourceType | string;

/**
 * @interface
 * Resources API "findAll" options
 */
export type FindAllMethodOptions = Omit<ActionFindAllArgs, 'hasManualRefresh' | 'depaginate' | 'saveCountAs' | 'incremental'>;

/**
 * @interface
 * Resources API "find" options
 */
export type FindMethodOptions = Omit<ActionFindArgs, 'invalidatePageCache' | 'method' | 'headers'>;

/**
 * @internal
 */
type PageOptions = Omit<ActionFindPageArgs, 'hasManualRefresh' | 'saveCountAs'>;

/**
 * @internal
 */
type MatchingOptions = Omit<ActionFindMatchingArgs, 'depaginate'>;

/**
 * @interface
 * Resources API "findFiltered" options
 *
 * Supports both paginated listing and label selector matching.
 * When `selector` is provided, resources are filtered by label selector.
 * Otherwise, standard pagination and filtering is used.
 */
export type FindFilteredMethodOptions = (PageOptions | MatchingOptions) & {
  /**
   * Optional label selector string to filter resources (e.g., "app=nginx,env=prod").
   * When provided, the request uses label selector matching instead of standard pagination.
   */
  selector?: string;
} | {
  /**
   * Label selector string to filter resources (e.g., "app=nginx,env=prod").
   */
  selector: string;
};
