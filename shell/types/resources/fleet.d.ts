export interface BundleResourceKey {
  kind: string,
  apiVersion: string,
  namespace?: string,
  name: string,
}

export interface BundleDeploymentResource extends BundleResourceKey {
  createdAt?: string,
}

export interface BundleModifiedResource extends BundleResourceKey {
  missing?: boolean,
  delete?: boolean,
  patch: string,
}

export interface BundleNonReadyResource extends BundleResourceKey {
  summary: { [state: string]: string }
}

export interface BundleNonReadyBundle {
  modifiedStatus: BundleModifiedResource[],
  nonReadyStatus: BundleNonReadyResource[],
}

export interface BundleDeploymentStatus {
  resources?: BundleDeploymentResource[],
  modifiedStatus?: BundleModifiedResource[],
  nonReadyStatus?: BundleNonReadyResource[],
}

export interface BundleStatusSummary {
  nonReadyResources?: BundleNonReadyBundle[],
}

export interface BundleStatus {
  resourceKey?: BundleResourceKey[],
  summary?: BundleStatusSummary,
}
