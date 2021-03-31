import { compatibleVersionsFor } from '@/store/catalog';
import { REPO_TYPE, REPO, CHART, VERSION } from '@/config/query-params';
import { NAME as APPS } from '@/config/product/apps';

export default {
  goToInstall() {
    let version;
    const chartVersions = this.versions;
    const currentCluster = this.$rootGetters['currentCluster'];

    const clusterProvider = currentCluster.status.provider || 'other';
    const windowsVersions = (chartVersions, 'windows');
    const linuxVersions = compatibleVersionsFor(chartVersions, 'linux');

    if (clusterProvider === 'rke.windows' && windowsVersions.length > 0) {
      version = windowsVersions[0].version;
    } else if (clusterProvider !== 'rke.windows' && linuxVersions.length > 0) {
      version = linuxVersions[0].version;
    } else {
      version = chartVersions[0].version;
    }

    this.currentRouter().push({
      name:   'c-cluster-apps-install',
      params: {
        cluster:  currentCluster.id,
        product:  APPS,
      },
      query: {
        [REPO_TYPE]: this.repoType,
        [REPO]:      this.repoName,
        [CHART]:     this.chartName,
        [VERSION]:   version,
      }
    });
  },
};
