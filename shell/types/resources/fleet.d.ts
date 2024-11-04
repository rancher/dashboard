export interface BundleDeploymentResource {
  kind: string,
  apiVersion: string,
  namespace?: string,
  name: string,
  createdAt: string,
}

export interface ModifiedStatus {
  kind: string,
  apiVersion: string,
  namespace?: string,
  name: string,
  missing?: boolean,
  delete?: boolean,
  patch: string,
}
