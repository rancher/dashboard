import { compatibleVersionsFor } from '@/store/catalog';
import {
  REPO_TYPE, REPO, CHART, VERSION, FROM_TOOLS, _FLAGGED, _UNFLAG
} from '@/config/query-params';

export default {
  goToInstall() {
    return (fromTools) => {
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
        params: { cluster: currentCluster.id },
        query:  {
          [REPO_TYPE]:  this.repoType,
          [REPO]:       this.repoName,
          [CHART]:      this.chartName,
          [VERSION]:    version,
          [FROM_TOOLS]: fromTools ? _FLAGGED : _UNFLAG
        }
      });
    };
  },
};
