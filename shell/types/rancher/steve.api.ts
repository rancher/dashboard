import { KubeGetResponse, KubeMetadata } from '@shell/types/kube/kube-api';

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

export interface SteveGetResponse extends KubeGetResponse {
  // Rancher specific properties (there are more)
  id: string,

  // Bucket for everything else (hopefully to remove once above populated)
  [key: string]: any
}

export type RancherKubeMetadata = KubeMetadata
