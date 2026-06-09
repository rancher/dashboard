/**
 * API providing version information about the running Rancher system.
 *
 * Available via Options API as `this.$version` or Composition API via `useVersion()`.
 *
 * Usage example:
 * ```ts
 * import { useVersion } from '@shell/apis';
 *
 * const version = useVersion();
 * console.log('Is Prime:', version.isRancherPrime);
 * console.log('Version:', version.version);
 * ```
 */
export interface VersionApi {
  /**
   * Whether this Rancher instance is a Prime edition
   */
  readonly isRancherPrime: boolean;

  /**
   * The Rancher server version string (e.g. "v2.8.0")
   */
  readonly version: string;

  /**
   * The git commit hash of the running Rancher build
   */
  readonly gitCommit: string;

  /**
   * The Kubernetes version of the management cluster (e.g. "v1.25.10")
   */
  readonly kubernetesVersion: string;
}
