/**
 * system API which providers information about the current system
 * * ![system Example](/img/system.png)
 *
 * Usage example:
 * ```ts
 * const rancherVersion = this.$shell.system.rancherVersion;
 * console.log('Rancher Version:', rancherVersion);
 * ```
 *
 */
export interface SystemApi {
  /**
   * Rancher version
   */
  rancherVersion: string;
  /**
   * Rancher UI version
   */
  uiVersion: string;
  /**
   * If Rancher system running is Prime
   */
  isRancherPrime: boolean;
  /**
   * Git Commit for Rancher system running
   */
  gitCommit: string;
  /**
   * Rancher Kubernetes version
   */
  kubernetesVersion: string;
  /**
   * If Rancher system is a Dev build
   */
  isDevBuild: boolean;
  /**
   * If Rancher system is a Pre-Release build/version
   */
  isPrereleaseVersion: boolean;
}
