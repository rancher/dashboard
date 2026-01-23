/**
 * Re-export column builder utilities for easy access
 *
 * This makes it simple for developers to import what they need:
 *
 * @example
 * import { column } from '@shell/core/columns';
 *
 * // Use in headers config
 * headers: {
 *   columns: [
 *     'state',
 *     column('targetPort').noSort(),
 *     'age'
 *   ]
 * }
 */

export {
  column,
  ColumnBuilder,
  processHeadersConfig,
  type StandardColumnKey,
  type ColumnConfig,
  type HeadersConfig,
  type PaginationOverrides,
} from './column-builder';

/**
 * Common preset configurations
 */
export const HeaderPresets = {
  /**
   * Standard namespaced resource: state, name, namespace, age
   */
  NAMESPACED: {
    preset:     'namespaced' as const,
    pagination: 'auto' as const,
  },

  /**
   * Cluster-scoped resource: state, name, age
   */
  CLUSTER: {
    preset:     'cluster' as const,
    pagination: 'auto' as const,
  },

  /**
   * Workload resource: state, name, namespace, type, images, endpoints, age
   */
  WORKLOAD: {
    preset:     'workload' as const,
    pagination: 'auto' as const,
  },

  /**
   * Storage resource: state, name, namespace, age
   */
  STORAGE: {
    preset:     'storage' as const,
    pagination: 'auto' as const,
  },
} as const;

/**
 * Helper to create a reusable header configuration
 *
 * @example
 * const myHeaders = createHeaderConfig({
 *   columns: ['state', 'name', 'namespace', 'age'],
 *   pagination: 'auto'
 * });
 *
 * // Use in multiple resources
 * { type: 'type1', headers: myHeaders }
 * { type: 'type2', headers: myHeaders }
 */
export function createHeaderConfig(config: any) {
  return config;
}
