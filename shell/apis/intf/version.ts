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
 * console.log('Is Rancher Prime:', version.rancher.isPrime);
 * console.log('Rancher Version:', version.rancher.version);
 * ```
 */
export interface VersionApi {
  rancher: {
    /**
   * Whether this Rancher instance is a Prime edition
   */
  readonly isPrime: boolean;

  /**
   * The Rancher server version string (e.g. "v2.8.0")
   */
  readonly version: string;

  /**
   * The git commit hash of the running Rancher build
   */
  readonly gitCommit: string;
  },
  kube: {
    /**
     * The Kubernetes version of the management cluster (e.g. "v1.25.10")
     */
    readonly version: string;
  }
}
