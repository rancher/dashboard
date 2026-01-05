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
// TODO: RC test scenario 2 (socket) - `shell/plugins/dashboard-store/actions.js`:`findPage. for a specific resource bork the before `await dispatch('request', { opt, type });` with `throw { status: 400, code: 'unknown revision' };` (x amount of times)
// TODO: RC test scenario 3 (socket) - `shell/plugins/steve/subscribe.js`:`ws.resource.changes`. for a specific resource set msg.revision to 0

// TODO: RC PR description - updates to side nav

// TODO: RC test scenario 1 (pagination-wrapper) - on a page other than home (currently contains non-paginated list of clusters) `shell/plugins/steve/subscribe.js`:`watch`. for a specific resource set the revision in the watch request to 'abc' x amount of times. back off should execute and eventually succeed
// TODO: RC test scenario 2 (pagination-wrapper) -
// TODO: RC test scenario 3 (pagination-wrapper) -

// TODO: RC test validation - whilst recurse is running... socket down OR forget type. When in pods list and backoff running navigate away
// TODO: RC test validation - sockets dieing
// TODO: RC test validation - with duel home page?!
// TODO: RC test validation - handle the case where a resource is stop watched. all existing backoffs should be cancelled

// TODO: RC bug. home page, tab a, edit cluster in tab b, we make a dupe request for prov cluster using the same revision
