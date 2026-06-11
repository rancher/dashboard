import { VersionApi } from '@shell/apis/intf/version';
import { getVersionData, getKubeVersionData, isRancherPrime } from '@shell/config/version';

export class VersionApiImpl implements VersionApi {
  readonly rancher = {
    get isPrime() {
      return isRancherPrime();
    },
    get version() {
      return getVersionData().Version;
    },
    get gitCommit() {
      return getVersionData().GitCommit;
    },
  };

  readonly kube = {
    get version() {
      const kubeData = (getKubeVersionData() as any) || {};

      return kubeData.gitVersion ?? '';
    },
  };
}
