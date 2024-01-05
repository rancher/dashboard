/**
 * TODO: Update @shell/plugins/dashboard-store/resource-class to TS.
 */
export interface SteveResource {
  save(): Promise<any>,
  remove(): Promise<any>,
}

export interface ResourceFetchOptions {
  id?: string,
  namespace?: string,
  selector?: string,
  force?: boolean
}

export interface ResourceFetchRequest {
  type: string,
  options?: ResourceFetchOptions
}

export interface ResourceManageOptions {
  metadata: {
    name: string,
    namespace?: string,
    labels?: {[key: string]: string},
    annotations?: {[key: string]: string}
  },
  spec?: any
}

export interface ResourceManageRequest {
  type: string,
  options: ResourceManageOptions,
  resource?: SteveResource
}
