import { CERT_MANAGER } from '../types';
import { resourceLocation } from './locations';

export interface IssuerRef {
  name: string;
  kind?: string;
  group?: string;
}

/**
 * cert-manager defaults `issuerRef.kind` to `Issuer` when it is omitted.
 * https://cert-manager.io/docs/reference/api-docs/#meta.cert-manager.io/v1.ObjectReference
 */
export function issuerRefType(issuerRef?: IssuerRef): string {
  return issuerRef?.kind === 'ClusterIssuer' ? CERT_MANAGER.CLUSTER_ISSUER : CERT_MANAGER.ISSUER;
}

/**
 * Route location for the Issuer or ClusterIssuer a resource's `issuerRef` points at.
 * ClusterIssuers are cluster scoped, so they resolve without a namespace.
 */
export function issuerRefLocation(model: any, issuerRef?: IssuerRef) {
  if (!issuerRef?.name) {
    return null;
  }

  const resource = issuerRefType(issuerRef);
  const namespace = resource === CERT_MANAGER.CLUSTER_ISSUER ? undefined : model.metadata?.namespace;

  return resourceLocation(model, resource, issuerRef.name, namespace);
}

/**
 * True when a resource in `refNamespace` referencing `issuerRef` resolves to `issuer`.
 * A ClusterIssuer is reachable from every namespace; an Issuer only from its own.
 */
export function issuerRefMatches(issuerRef: IssuerRef | undefined, refNamespace: string | undefined, issuer: any): boolean {
  if (!issuerRef?.name || issuerRef.name !== issuer?.metadata?.name) {
    return false;
  }

  if (issuerRefType(issuerRef) !== issuer?.type) {
    return false;
  }

  return issuer.type === CERT_MANAGER.CLUSTER_ISSUER || refNamespace === issuer.metadata?.namespace;
}
