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

// TODO: RC PR Description - General - Changed back-off to return a promise with the eventual result rather than just the timer object
// TODO: RC PR Description - Scenario 2 - Ensure all places that make a findPage requests as a result of resource.changes event contain revision
// TODO: RC PR Description   - This happens in two places
// TODO: RC PR Description     - store managed resources - directly in shell/plugins/steve/subscribe.js
//                             - wrapper managed resources -  shell/utils/pagination-wrapper.ts
// TODO: RC PR Description - Scenario 2 - Ensure that when we make requests using a revision we back-off retry if failed given invalid revision
// TODO: RC PR Description - Scenario 3 - Ensure that we cache the revision from findPage requests, and abort resource.changes process if the cached revision is newer than the resource.changes revision
// TODO: RC PR Description -
