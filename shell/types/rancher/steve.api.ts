import { KubeGetResponse, KubeMetadata } from '@shell/types/kube/kube-api';

/**
 * Collection of string based values returned vis Steve API 'code' field
 */
export const STEVE_HTTP_CODES = {
  /**
   * When the query param `revision` is sent and it's not in the vai cache then return this error
   */
  UNKNOWN_REVISION: 'unknown revision'
};

/**
 * Steve API JSON response for LIST requests
 */
export interface SteveListResponse<T = any> {
  actions: any,
  count: number,
  data: T[],
  links: any,
  resourceType: string,
  revision: string,
  type: string,

  // Bucket for everything else (hopefully to remove once above populated)
  [key: string]: any
}

/**
 * Steve API JSON response for GET requests
 */
export interface SteveGetResponse extends KubeGetResponse {
  // Rancher specific properties (there are more)
  id: string,

  // Bucket for everything else (hopefully to remove once above populated)
  [key: string]: any
}

export type RancherKubeMetadata = KubeMetadata

// TODO: RC Tidy up myLogger, scen1, scen3, scenType, debugger

// TODO: RC test scenario 1 (socket) - `shell/plugins/steve/subscribe.js`:`watch`. for a specific resource set the revision in the watch request to 'abc' x amount of times. back off should execute and eventually succeed
// TODO: RC test scenario 2 (socket) - `shell/plugins/dashboard-store/actions.js`:`findPage. for a specific resource bork the before `await dispatch('request', { opt, type });` with `throw { status: 400, code: 'unknown revision' };` (trigger change in resource --> will error x times)
// TODO: RC test scenario 3 (socket) - `shell/plugins/steve/subscribe.js`:`ws.resource.changes`. for a specific resource set msg.revision to 0

// TODO: RC PR description - updates to side nav

// all on fleet dashboard (only resources using wrapper atm are side nav clusters, avoid pages that load all clusters like home or harvester pages)
// TODO: RC test scenario 1 (pagination-wrapper) - `shell/plugins/steve/subscribe.js`:`watch`. for management.cattle.io.cluster set the revision in the watch request to 'abc' x amount of times. back off should execute and eventually succeed
// TODO: RC test scenario 2 (pagination-wrapper) - `shell/plugins/dashboard-store/actions.js`:`findPage. for management.cattle.io.cluster bork the before `await dispatch('request', { opt, type });` with `throw { status: 400, code: 'unknown revision' };` (trigger change in cluster --> will error x times).
// TODO: RC test scenario 3 (pagination-wrapper) - `shell/plugins/steve/subscribe.js`:`ws.resource.changes`. for a specific resource set msg.revision to 0 (trigger change in cluster --> will error x times).

// TODO: RC PR description - Whilst a backoff is running cancel the requirement (on pods list navigate away whilst backoff is running, it should not push result to store)

// TODO: RC unit tests?!
