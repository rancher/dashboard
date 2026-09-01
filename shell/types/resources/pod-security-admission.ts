/**
 * Mode Description
 * - 'enforce': Policy violations will cause the pod to be rejected.
 * - 'audit':   Policy violations will trigger the addition of an audit annotation to the event recorded in the audit log, but are otherwise allowed.
 * - 'warn':    Policy violations will trigger a user-facing warning, but are otherwise allowed.
 */
export type PSAMode = 'enforce' | 'audit' | 'warn';

/**
 * Pod Security admission places requirements on a Pod's Security Context and other related fields according to the three levels defined by the Pod Security Standards:
 * privileged, baseline, and restricted.
 * Refer to the Pod Security Standards page for an in-depth look at those requirements.
 */
export type PSALevel = 'privileged' | 'baseline' | 'restricted';

/**
 * Usernames:         requests from users with an exempt authenticated (or impersonated) username are ignored.
 * RuntimeClassNames: pods and workload resources specifying an exempt runtime class name are ignored.
 * Namespaces:        pods and workload resources in an exempt namespace are ignored.
 */
export type PSADimension = 'usernames' | 'runtimeClasses' | 'namespaces'

export type PSADefaults = Record<PSAMode, PSALevel>
export type PSAExemptions = Record<PSADimension, string[]>

export interface PSAConfig {
  defaults: PSADefaults,
  exemptions: PSAExemptions
}

export interface PSA {
  configuration: PSAConfig,
  metadata: {
    labels: Record<string, string>
  }
}
