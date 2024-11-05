export interface BundleResourceKey {
  kind: string,
  apiVersion: string,
  namespace?: string,
  name: string,
}

export interface BundleDeploymentResource extends BundleResourceKey {
  createdAt?: string,
}

export interface BundleDeploymentModifiedStatus extends BundleResourceKey {
  missing?: boolean,
  delete?: boolean,
  patch: string,
}

export interface BundleNonReadyBundle {
  modifiedStatus: BundleDeploymentModifiedStatus[],
}

export interface BundleDeploymentStatus {
  resources?: BundleDeploymentResource[],
  modifiedStatus?: BundleDeploymentModifiedStatus[],
}

export interface BundleStatusSummary {
  nonReadyResources?: BundleNonReadyBundle[],
}

export interface BundleStatus {
  resourceKey?: BundleResourceKey[],
  summary?: BundleStatusSummary,
}
