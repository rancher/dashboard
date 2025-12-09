import { SystemApi } from '@shell/apis/intf/shell';
import { Store } from 'vuex';
import { isDevBuild, isPrerelease } from '@shell/utils/version';
import { getVersionData, getKubeVersionData, isRancherPrime } from '@shell/config/version';

export class SystemApiImpl implements SystemApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Rancher version
   */
  get rancherVersion(): string {
    return getVersionData().Version;
  }

  /**
   * Rancher UI version
   */
  get uiVersion(): string {
    const storeTyped = this.store as any;

    return storeTyped.$config.dashboardVersion;
  }

  /**
   * If Rancher system running is Prime
   */
  get isRancherPrime(): boolean {
    return isRancherPrime();
  }

  /**
   * Git Commit for Rancher system running
   */
  get gitCommit(): string {
    return getVersionData().GitCommit;
  }

  /**
   * Rancher Kubernetes version
   */
  get kubernetesVersion(): string {
    const kubeData = getKubeVersionData() as any || {};

    return kubeData.gitVersion;
  }

  /**
   * If Rancher system is a Dev build
   */
  get isDevBuild(): boolean {
    return isDevBuild(this.rancherVersion);
  }

  /**
   * If Rancher system is a Pre-Release build/version
   */
  get isPrereleaseVersion(): boolean {
    return isPrerelease(this.rancherVersion);
  }
}
