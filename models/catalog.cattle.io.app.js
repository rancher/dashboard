import Vue from 'vue';
import {
  NAMESPACE, NAME, REPO, REPO_TYPE, CHART, VERSION, _VIEW
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, FLEET } from '@/config/labels-annotations';
import { compare, sortable } from '@/utils/version';
import { filterBy } from '@/utils/array';
import { CATALOG } from '@/config/types';

export default {
  showMasthead() {
    return (mode) => {
      return mode === _VIEW;
    };
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'disableOpenApiValidation', false);
      Vue.set(this, 'noHooks', false);
      Vue.set(this, 'skipCRDs', false);
      Vue.set(this, 'timeout', 300);
      Vue.set(this, 'wait', true);
    };
  },

  availableActions() {
    const out = this._standardActions;

    const upgrade = {
      action:     'goToUpgrade',
      enabled:    true,
      icon:       'icon icon-fw icon-edit',
      label:      this.t('catalog.install.action.goToUpgrade'),
    };

    out.unshift(upgrade);

    return out;
  },

  matchingChart() {
    return (includeHidden) => {
      const chart = this.spec?.chart;

      if ( !chart ) {
        return;
      }

      const chartName = chart.metadata?.name;
      const preferRepoType = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE];
      const preferRepoName = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME];
      const match = this.$rootGetters['catalog/chart']({
        chartName,
        preferRepoType,
        preferRepoName,
        includeHidden
      });

      return match;
    };
  },

  upgradeAvailable() {
    // false = does not apply (managed by fleet)
    // null = no upgrade found
    // object = version available to upgrade to

    if ( this.spec?.chart?.metadata?.annotations?.[FLEET.BUNDLE_ID] ) {
      // Things managed by fleet shouldn't show ugrade available even if there might be.
      return false;
    }

    const chart = this.matchingChart(false);

    if ( !chart ) {
      return null;
    }

    const thisVersion = this.spec?.chart?.metadata?.version;
    const newestVersion = chart.versions?.[0]?.version;

    if ( !thisVersion || !newestVersion ) {
      return null;
    }

    if ( compare(thisVersion, newestVersion) < 0 ) {
      return cleanupVersion(newestVersion);
    }

    return null;
  },

  upgradeAvailableSort() {
    const version = this.upgradeAvailable;

    if ( !version ) {
      return '~'; // Tilde sorts after all numbers and letters
    }

    return sortable(version);
  },

  goToUpgrade() {
    return (forceVersion) => {
      const match = this.matchingChart(true);
      const versionName = this.spec?.chart?.metadata?.version;
      const query = {
        [NAMESPACE]: this.metadata.namespace,
        [NAME]:      this.metadata.name,
        [VERSION]:   forceVersion || versionName,
      };

      if ( match ) {
        query[REPO] = match.repoName;
        query[REPO_TYPE] = match.repoType;
        query[CHART] = match.chartName;
      }

      this.currentRouter().push({
        name:   'c-cluster-apps-install',
        params: {
          product:   this.$rootGetters['productId'],
          cluster:   this.$rootGetters['clusterId'],
        },
        query,
      });
    };
  },

  details() {
    const t = this.$rootGetters['i18n/t'];

    const first = this.spec?.info?.firstDeployed;
    const last = this.spec?.info?.lastDeployed;

    if ( first && last && first !== last ) {
      return [
        {
          label:     t('model."catalog.cattle.io.app".lastDeployed'),
          formatter: 'LiveDate',
          content:   last,
        },
      ];
    }

    return [];
  },

  nameDisplay() {
    const out = this.spec?.name || this.metadata?.name || this.id || '';

    return out;
  },

  chartDisplay() {
    const name = this.spec?.chart?.metadata?.name || '?';

    return `${ name }:${ this.versionDisplay }`;
  },

  versionDisplay() {
    return cleanupVersion(this.spec?.chart?.metadata?.version);
  },

  versionSort() {
    return sortable(this.versionDisplay);
  },

  remove() {
    return async(opt = {}) => {
      const res = await this.doAction('uninstall', opt);

      const operation = await this.$dispatch('find', {
        type: CATALOG.OPERATION,
        id:   `${ res.operationNamespace }/${ res.operationName }`
      });

      try {
        await operation.waitForLink('logs');
        operation.openLogs();
      } catch (e) {
        // The wait times out eventually, move on...
      }
    };
  },

  canDelete() {
    return this.hasAction('uninstall');
  },

  deployedResources() {
    return filterBy(this.metadata?.relationships || [], 'rel', 'helmresource');
  },
};

function cleanupVersion(version) {
  if ( !version ) {
    return '?';
  }

  if ( version.match(/^v/i) ) {
    version = version.substr(1);
  }

  const hash = version.match(/[0-9a-f]{32,}/);

  if ( hash ) {
    version = version.replace(hash[0], hash[0].substr(0, 7));
  }

  return version;
}
