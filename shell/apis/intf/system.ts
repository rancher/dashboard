/**
 * system API which providers information about the current system
 * * ![system Example](/img/system.png)
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
   * Rancher CLI version
   */
  cliVersion: string;
  /**
   * Rancher Helm version
   */
  helmVersion: string;
  /**
   * Rancher Docker Machine version
   */
  machineVersion: string;
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
   * Rancher build platform
   */
  buildPlatform: string;
  /**
   * If Rancher system is a Dev build
   */
  isDevBuild: boolean;
  /**
   * If Rancher system is a Pre-Release build/version
   */
  isPrereleaseVersion: boolean;
}
