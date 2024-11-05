export interface ResourceKey {
  kind: string,
  apiVersion: string,
  namespace?: string,
  name: string,
}

export interface BundleDeploymentResource extends ResourceKey {
  createdAt?: string,
}

export interface ModifiedStatus extends ResourceKey {
  missing?: boolean,
  delete?: boolean,
  patch: string,
}

export interface NonReadyBundle {
  modifiedStatus: ModifiedStatus[],
}
