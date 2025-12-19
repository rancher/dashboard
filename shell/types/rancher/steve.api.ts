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

// TODO: RC test / write down - findPage response should persist revision to store. it will be used to confirm resource.changes revision is newer than our cached
// TODO: RC test / write down - findPage requests from wrapper + socket should contain a revision
// TODO: RC test watches based on selectors
// TODO: RC test scenario 1 (socket) - in shell/plugins/steve/subscribe.js:`watch`. for a specific resource bork the revision in the watch request (x amount of times)
// TODO: RC test scenario 2 (socket) - shell/plugins/dashboard-store/actions.js:`findPage. for a specific resource bork the before `await dispatch('request', { opt, type });` with `throw { status: 400, code: 'unknown revision' };` (x amount of times)
// TODO: RC test scenario 3 (socket) - in shell/plugins/steve/subscribe.js:`ws.resource.changes`. for a specific resource set msg.revision to 0

// TODO: RC test scenario 1 (pagination-wrapper) -
// TODO: RC test scenario 2 (pagination-wrapper) -
// TODO: RC test scenario 3 (pagination-wrapper) -

// TODO: RC test validation - whilst recurse is running... socket down OR forget type. When in pods list and backoff running navigate away
// TODO: RC test validation - sockets dieing

// TODO: RC handle the case where a resource is stop watched. all existing backoffs should be cancelled

// TODO: RC PR Description - General - Changed back-off to return a promise with the eventual result rather than just the timer object
// TODO: RC PR Description - Scenario 2 - Ensure all places that make a findPage requests as a result of resource.changes event contain revision
// TODO: RC PR Description   - This happens in two places
// TODO: RC PR Description     - store managed resources - directly in shell/plugins/steve/subscribe.js `fetchPageResources`
//                             - wrapper managed resources -  shell/utils/pagination-wrapper.ts `request`
// TODO: RC PR Description - Scenario 2 - Ensure that when we make requests using a revision we back-off retry if failed given invalid revision
// TODO: RC PR Description - Scenario 3 - Ensure that we cache the revision from findPage requests, and abort resource.changes process if the cached revision is newer than the resource.changes revision
// TODO: RC PR Description - Challenges - Reproducing scenarios
// TODO: RC PR Description - Challenges - Reproducing combined scenarios
// TODO: RC PR Description - Challenges - Both socket and listeners

// TODO: RC bug. home page, tab a, edit cluster in tab b, we make a dupe request for prov cluster using the same revision
