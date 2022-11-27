import { compatibleVersionsFor } from '@shell/store/catalog';
import {
  REPO_TYPE, REPO, CHART, VERSION, _FLAGGED, HIDE_SIDE_NAV
} from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class Chart extends SteveModel {
  queryParams(from, hideSideNav) {
    let version;
    const chartVersions = this.versions;
    const currentCluster = this.$rootGetters['currentCluster'];
    const workerOSs = currentCluster?.workerOSs;
    const compatibleVersions = compatibleVersionsFor(this, workerOSs);

    if (compatibleVersions.length) {
      version = compatibleVersions[0].version;
    } else {
      version = chartVersions[0].version;
    }

    const out = {
      [REPO_TYPE]: this.repoType,
      [REPO]:      this.repoName,
      [CHART]:     this.chartName,
      [VERSION]:   version,
    };

    if ( from ) {
      out[from] = _FLAGGED;
    }

    if (hideSideNav) {
      out[HIDE_SIDE_NAV] = _FLAGGED;
    }

    return out;
  }

  goToInstall(from, clusterId, hideSideNav) {
    const query = this.queryParams(from, hideSideNav);
    const currentCluster = this.$rootGetters['currentCluster'];

    this.currentRouter().push({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: clusterId || currentCluster?.id || BLANK_CLUSTER },
      query,
    });
  }
}
