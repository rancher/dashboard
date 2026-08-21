/**
 * cert-manager stamps every resource it creates on a certificate's behalf with the name of that
 * certificate, so the issuance chain can be reassembled without relying on `ownerReferences`
 * (which Steve does not always include in list responses).
 * https://cert-manager.io/docs/reference/api-docs/
 */
export const CERTIFICATE_NAME_ANNOTATION = 'cert-manager.io/certificate-name';
export const CERTIFICATE_REVISION_ANNOTATION = 'cert-manager.io/certificate-revision';

export function certificateNameOf(resource: any): string | undefined {
  return resource?.metadata?.annotations?.[CERTIFICATE_NAME_ANNOTATION] ||
    (resource?.metadata?.ownerReferences || []).find((o: any) => o.kind === 'Certificate')?.name;
}

export function ownedBy(resource: any, uid?: string): boolean {
  return !!uid && (resource?.metadata?.ownerReferences || []).some((o: any) => o.uid === uid);
}

/** Resources cert-manager created for `certificate`, newest revision first. */
export function relatedTo(resources: any[], certificate: any): any[] {
  const { name, namespace, uid } = certificate?.metadata || {};

  return resources
    .filter((r) => r.metadata?.namespace === namespace && (certificateNameOf(r) === name || ownedBy(r, uid)))
    .sort((a, b) => revisionOf(b) - revisionOf(a));
}

function revisionOf(resource: any): number {
  return Number(resource?.metadata?.annotations?.[CERTIFICATE_REVISION_ANNOTATION] || 0);
}
