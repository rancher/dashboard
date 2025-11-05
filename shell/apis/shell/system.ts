import { SystemApi } from '@shell/apis/intf/shell';
import { Store } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
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
   * Rancher CLI version
   */
  get cliVersion() {
    return this.store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_CLI)?.value || '';
  }

  /**
   * Rancher Helm version
   */
  get helmVersion() {
    return this.store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_HELM)?.value || '';
  }

  /**
   * Rancher Docker Machine version
   */
  get machineVersion() {
    return this.store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_MACHINE)?.value || '';
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
   * Rancher build platform
   */
  get buildPlatform(): string {
    const kubeData = getKubeVersionData() as any || {};

    return kubeData.platform;
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
