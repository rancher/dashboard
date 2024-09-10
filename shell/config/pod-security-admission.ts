import { PSADimension, PSALevel, PSAMode } from '@shell/types/resources/pod-security-admission';

/**
 * All the PSA labels are created with this prefix, so we can use this to identify them
 */
export const PSALabelPrefix = 'pod-security.kubernetes.io/';

/**
 * Default modes of restrictions used for PSA
 */
export const PSAModes: PSAMode[] = ['enforce', 'audit', 'warn'];

/**
 * Levels of restrictions for the PSA
 */
export const PSALevels: PSALevel[] = ['privileged', 'baseline', 'restricted'];

/**
 * Used for restrictions in templates
 */
export const PSADimensions: PSADimension[] = ['usernames', 'runtimeClasses', 'namespaces'];

/**
 * For the UI, we prefer use this value as default one
 */
export const PSADefaultLevel = PSALevels[0];

/**
 * Default values for PSA should always be this one
 */
export const PSADefaultVersion = 'latest';

/**
 * PSA labels for namespaces.
 * MODE must be one of `enforce`, `audit`, or `warn`.
 * LEVEL must be one of `privileged`, `baseline`, or `restricted`.
 * pod-security.kubernetes.io/<MODE>: <LEVEL>
 *
 * Optional: per-mode version label that can be used to pin the policy to the
 * version that shipped with a given Kubernetes minor version (for example v1.25).
 *
 * https://kubernetes.io/docs/concepts/security/pod-security-admission/#pod-security-admission-labels-for-namespaces
 */
export const PSALabelsNamespaceMode = PSAModes.reduce((acc, mode) => [
  ...acc,
  `${ PSALabelPrefix }${ mode }`,
], [] as string[]);

/**
 * PSA labels for namespaces.
 * MODE must be one of `enforce`, `audit`, or `warn`.
 * VERSION must be a valid Kubernetes minor version, or `latest`.
 * pod-security.kubernetes.io/<MODE>-version: <VERSION>
 *
 * https://kubernetes.io/docs/concepts/security/pod-security-admission/#pod-security-admission-labels-for-namespaces
 */
export const PSALabelsNamespaceVersion = PSAModes.reduce((acc, mode) => [
  ...acc,
  `${ PSALabelPrefix }${ mode }-version`
], [] as string[]);

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
export const PSALabelsNamespaces: string[] = [...PSALabelsNamespaceMode, ...PSALabelsNamespaceVersion];

/**
 * Generated table of icons with or hardcoded generated PSA labels
 */
export const PSAIconsDisplay: Record<string, string> = Object.assign({}, ...PSALabelsNamespaces.map((psa) => ({ [psa]: 'icon-pod_security' })));
