
import { mapGetters } from 'vuex';

import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, DEPRECATED, HIDDEN, _FLAGGED, _CREATE, _EDIT
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS } from '@/config/labels-annotations';
import { SHOW_PRE_RELEASE, mapPref } from '@/store/prefs';
import { NAME as EXPLORER } from '@/config/product/explorer';
import { NAME as MANAGER } from '@/config/product/manager';

import { formatSi, parseSi } from '@/utils/units';
import { CAPI, CATALOG } from '@/config/types';
import { isPrerelease } from '@/utils/version';

export default {
  data() {
    return {
      version:     null,
      versionInfo: null,
      existing:    null,

      ignoreWarning: false,

      catalogOSAnnotation: CATALOG_ANNOTATIONS.SUPPORTED_OS,
    };
  },

  computed: {
    ...mapGetters(['currentCluster', 'isRancher']),

    showPreRelease: mapPref(SHOW_PRE_RELEASE),

    chart() {
      if ( this.repo && this.query.chartName ) {
        return this.$store.getters['catalog/chart']({
          repoType:      this.query.repoType,
          repoName:      this.query.repoName,
          chartName:     this.query.chartName,
          includeHidden: true,
        });
      }

      return null;
    },

    repo() {
      return this.$store.getters['catalog/repo']({
        repoType: this.query.repoType,
        repoName: this.query.repoName,
      });
    },

    showReadme() {
      return !!this.versionInfo?.readme;
    },

    hasReadme() {
      return !!this.versionInfo?.appReadme || !!this.versionInfo?.readme;
    },

    mappedVersions() {
      const {
        currentCluster,
        catalogOSAnnotation,
      } = this;

      const versions = this.chart?.versions || [];
      const selectedVersion = this.targetVersion;
      const isWindows = currentCluster?.providerOs === 'windows';
      const out = [];

      versions.forEach((version) => {
        const nue = {
          label:           version.version,
          version:         version.version,
          originalVersion: version.version,
          shortLabel:      version.version.length > 16 ? `${ version.version.slice(0, 15) }...` : version.version,
          id:              version.version,
          created:         version.created,
          disabled:        false,
          keywords:        version.keywords
        };

        if ( version?.annotations?.[catalogOSAnnotation] === 'windows' ) {
          nue.label = this.t('catalog.install.versions.windows', { ver: version.version });

          if ( !isWindows ) {
            nue.disabled = true;
          }
        } else if ( version?.annotations?.[catalogOSAnnotation] === 'linux' ) {
          nue.label = this.t('catalog.install.versions.linux', { ver: version.version });

          if ( isWindows ) {
            nue.disabled = true;
          }
        }

        if (!this.showPreRelease && isPrerelease(version.version)) {
          return;
        }

        out.push(nue);
      });

      const selectedMatch = out.find(v => v.id === selectedVersion);

      if (!selectedMatch) {
        out.unshift({
          label:           selectedVersion,
          originalVersion: selectedVersion,
          shortLabel:      selectedVersion.length > 16 ? `${ selectedVersion.slice(0, 15) }...` : selectedVersion,
          id:              selectedVersion,
          created:         null,
          disabled:        false,
          keywords:        []
        });
      }

      const currentVersion = out.find(v => v.originalVersion === this.currentVersion);

      if (currentVersion) {
        currentVersion.label = this.t('catalog.install.versions.current', { ver: this.currentVersion });
      }

      return out;
    },

    filteredVersions() {
      return this.showPreRelease ? this.mappedVersions : this.mappedVersions.filter(v => !v.isPre);
    },

    query() {
      const query = this.$route.query;

      return {
        repoType:     query[REPO_TYPE],
        repoName:     query[REPO],
        chartName:    query[CHART],
        versionName:  query[VERSION],
        appNamespace: query[NAMESPACE] || '',
        appName:      query[NAME] || '',
        description:  query[DESCRIPTION_QUERY]
      };
    },

    showDeprecated() {
      return this.$route.query[DEPRECATED] === _FLAGGED;
    },

    showHidden() {
      return this.$route.query[HIDDEN] === _FLAGGED;
    },

    warnings() {
      const warnings = [];

      if ( this.existing ) {
        // Ignore the limits on upgrade (or if asked by query) and don't show any warnings
      } else {
        const needCpu = parseSi(this.version?.annotations?.[CATALOG_ANNOTATIONS.REQUESTS_CPU] || '0');
        const needMemory = parseSi(this.version?.annotations?.[CATALOG_ANNOTATIONS.REQUESTS_MEMORY] || '0');

        // Note: These are null if unknown
        const availableCpu = this.currentCluster?.availableCpu;
        const availableMemory = this.currentCluster?.availableMemory;

        if ( availableCpu !== null && availableCpu < needCpu ) {
          warnings.push(this.t('catalog.install.error.insufficientCpu', {
            need: Math.round(needCpu * 100) / 100,
            have: Math.round(availableCpu * 100) / 100,
          }));
        }

        if ( availableMemory !== null && availableMemory < needMemory ) {
          warnings.push(this.t('catalog.install.error.insufficientMemory', {
            need: formatSi(needMemory, {
              increment: 1024, suffix: 'iB', firstSuffix: 'B'
            }),
            have: formatSi(availableMemory, {
              increment: 1024, suffix: 'iB', firstSuffix: 'B'
            }),
          }));
        }
      }

      return warnings;
    },

    requires() {
      const requires = [];

      const required = (this.version?.annotations?.[CATALOG_ANNOTATIONS.REQUIRES_GVK] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

      if ( required.length ) {
        for ( const gvr of required ) {
          if ( this.$store.getters['catalog/isInstalled']({ gvr }) ) {
            continue;
          }

          const provider = this.provider(gvr);

          const url = this.$router.resolve(this.chartLocation(true, gvr)).href;

          if ( provider ) {
            requires.push(this.t('catalog.install.error.requiresFound', {
              url,
              name: provider.name
            }, true));
          } else {
            requires.push(this.t('catalog.install.error.requiresMissing', { name: gvr }));
          }
        }
      }

      return requires;
    },

    currentVersion() {
      return this.existing?.spec.chart.metadata.version;
    },

    targetVersion() {
      return this.version ? this.version.version : this.query.versionName;
    },

    action() {
      if (this.existing) {
        return this.currentVersion === this.targetVersion ? 'update' : 'upgrade';
      }

      return 'install';
    },

    isChartTargeted() {
      return this.chart?.targetNamespace && this.chart?.targetName;
    },

    hasQuestions() {
      return this.versionInfo && !!this.versionInfo.questions;
    },
  },

  methods: {
    async fetchChart() {
      await this.$store.dispatch('catalog/load');

      if ( this.query.appNamespace && this.query.appName ) {
        // Explicitly asking for edit

        try {
          this.existing = await this.$store.dispatch('cluster/find', {
            type: CATALOG.APP,
            id:   `${ this.query.appNamespace }/${ this.query.appName }`,
          });

          this.mode = _EDIT;
        } catch (e) {
          this.mode = _CREATE;
          this.existing = null;
        }
      } else if ( this.chart?.targetNamespace && this.chart?.targetName ) {
        // Asking to install a special chart with fixed namespace/name
        // so edit it if there's an existing install

        try {
          this.existing = await this.$store.dispatch('cluster/find', {
            type: CATALOG.APP,
            id:   `${ this.chart.targetNamespace }/${ this.chart.targetName }`,
          });
          this.mode = _EDIT;
        } catch (e) {
          this.mode = _CREATE;
          this.existing = null;
        }
      } else {
        // Regular create

        this.mode = _CREATE;
      }

      if ( !this.chart ) {
        return;
      }

      if ( !this.query.versionName && this.chart.versions?.length ) {
        this.query.versionName = this.chart.versions[0].version;
      }

      if ( !this.query.versionName ) {
        return;
      }

      try {
        this.version = this.$store.getters['catalog/version']({
          repoType:      this.query.repoType,
          repoName:      this.query.repoName,
          chartName:     this.query.chartName,
          versionName: this.query.versionName
        });
      } catch (e) {
        console.error('Unable to fetch Version: ', e); // eslint-disable-line no-console
      }
      if (!this.version) {
        console.warn('No version found: ', this.query.repoType, this.query.repoName, this.query.chartName, this.query.versionName);// eslint-disable-line no-console
      }

      try {
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:      this.query.repoType,
          repoName:      this.query.repoName,
          chartName:     this.query.chartName,
          versionName: this.query.versionName
        });
      } catch (e) {
        console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
      }
    },

    selectVersion({ id: version }) {
      this.$router.applyQuery({ [VERSION]: version });
    },

    provider(gvr) {
      return this.$store.getters['catalog/versionProviding']({
        gvr,
        repoName: this.chart.repoName,
        repoType: this.chart.repoType
      });
    },

    /**
     * Location of chart install or details page for either the current chart or from gvr
     */
    chartLocation(install = false, gvr) {
      const provider = gvr ? this.provider(gvr) : {
        repoType: this.chart.repoType,
        repoName: this.chart.repoName,
        name:     this.chart.chartName,
        version:  this.chart.versionName,
      };

      return {
        name:   install ? 'c-cluster-apps-charts-install' : 'c-cluster-apps-charts-chart',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]: provider.repoType,
          [REPO]:      provider.repoName,
          [CHART]:     provider.name,
          [VERSION]:   provider.version,
        }
      };
    },

    appLocation() {
      return this.existing?.detailLocation || {
        name:   `c-cluster-product-resource`,
        params: {
          product:   this.$store.getters['productId'],
          cluster:   this.$store.getters['clusterId'],
          resource:  CATALOG.APP,
        }
      };
    },

    clusterToolsLocation() {
      return {
        name:   `c-cluster-explorer-tools`,
        params: {
          product:   EXPLORER,
          cluster:   this.$store.getters['clusterId'],
          resource:  CATALOG.APP,
        }
      };
    },

    clustersLocation() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  MANAGER,
          resource: CAPI.RANCHER_CLUSTER,
        },
      };
    }
  },

};
