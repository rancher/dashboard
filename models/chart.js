import { compatibleVersionsFor } from '@/store/catalog';
import {
  REPO_TYPE, REPO, CHART, VERSION, _FLAGGED, HIDE_SIDE_NAV
} from '@/config/query-params';
import { BLANK_CLUSTER } from '@/store';

export default {
  queryParams() {
    return (from, hideSideNav) => {
      let version;
      const chartVersions = this.versions;
      const currentCluster = this.$rootGetters['currentCluster'];

      const clusterProvider = currentCluster?.status.provider || 'other';
      const windowsVersions = (chartVersions, 'windows');
      const linuxVersions = compatibleVersionsFor(chartVersions, 'linux');

      if (clusterProvider === 'rke.windows' && windowsVersions.length > 0) {
        version = windowsVersions[0].version;
      } else if (clusterProvider !== 'rke.windows' && linuxVersions.length > 0) {
        version = linuxVersions[0].version;
      } else {
        version = chartVersions[0].version;
      }

      const out = {
        [REPO_TYPE]:  this.repoType,
        [REPO]:       this.repoName,
        [CHART]:      this.chartName,
        [VERSION]:    version,
      };

      if ( from ) {
        out[from] = _FLAGGED;
      }

      if (hideSideNav) {
        out[HIDE_SIDE_NAV] = _FLAGGED;
      }

      return out;
    };
  },

  goToInstall() {
    return (from, clusterId, hideSideNav) => {
      const query = this.queryParams(from, hideSideNav);
      const currentCluster = this.$rootGetters['currentCluster'];

      this.currentRouter().push({
        name:   'c-cluster-apps-charts-install',
        params: { cluster: clusterId || currentCluster?.id || BLANK_CLUSTER },
        query,
      });
    };
  },
};
