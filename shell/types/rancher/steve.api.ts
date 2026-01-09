import { KubeGetResponse, KubeMetadata } from '@shell/types/kube/kube-api';

/**
 * Collection of string based values used by the Steve API response's `code` field
 */
export const STEVE_RESPONSE_CODE = {
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
