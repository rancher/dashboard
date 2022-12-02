/**
 * PSA labels for namespaces.
 * MODE must be one of `enforce`, `audit`, or `warn`.
 * LEVEL must be one of `privileged`, `baseline`, or `restricted`.
 * pod-security.kubernetes.io/<MODE>: <LEVEL>
 *
 * Optional: per-mode version label that can be used to pin the policy to the
 * version that shipped with a given Kubernetes minor version (for example v1.25).
 *
 * MODE must be one of `enforce`, `audit`, or `warn`.
 * VERSION must be a valid Kubernetes minor version, or `latest`.
 * pod-security.kubernetes.io/<MODE>-version: <VERSION>
 *
 * https://kubernetes.io/docs/concepts/security/pod-security-admission/#pod-security-admission-labels-for-namespaces
 */
export const PSALabelsNamespaces: string[] = [`enforce`, `audit`, `warn`].reduce((acc, mode) => [
  ...acc,
  `pod-security.kubernetes.io/${ mode }`,
  `pod-security.kubernetes.io/${ mode }-version`
], [] as string[]);

export const PSAIconsDisplay: Record<string, string> = Object.assign({}, ...PSALabelsNamespaces.map(psa => ({ [psa]: 'icon-pod_security' })));
