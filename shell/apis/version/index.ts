import { VersionApi } from '@shell/apis/intf/version';
import { getVersionData, getKubeVersionData, isRancherPrime } from '@shell/config/version';

export class VersionApiImpl implements VersionApi {
  get isRancherPrime(): boolean {
    return isRancherPrime();
  }

  get version(): string {
    return getVersionData().Version;
  }

  get gitCommit(): string {
    return getVersionData().GitCommit;
  }

  get kubernetesVersion(): string {
    const kubeData = getKubeVersionData() as any || {};

    return kubeData.gitVersion ?? '';
  }
}
