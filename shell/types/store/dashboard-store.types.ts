/**
 * Properties on all findX actions
 */
export type ActionCoreFindArgs = {
  force?: boolean,
}

/**
 * Args used for findAll action
 */
export interface ActionFindAllArgs extends ActionCoreFindArgs {
  watch?: boolean,
  namespaced?: string[],
  incremental?: boolean,
  hasManualRefresh?: boolean,
  limit?: number,
  /**
   * Iterate over all pages and return all resources.
   *
   * This is done via the native kube pagination api, not steve
   */
  depaginate?: boolean,
}
