
import { mapGetters } from 'vuex';

import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, FORCE, DEPRECATED, HIDDEN, _FLAGGED
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS } from '@/config/labels-annotations';
import { SHOW_PRE_RELEASE, mapPref } from '@/store/prefs';

const semver = require('semver');

export default {
  data() {
    return {
      version:     null,
      versionInfo: null,

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

    mappedVersions() {
      const {
        currentCluster,
        catalogOSAnnotation,
      } = this;

      const versions = this.chart?.versions || [];
      const selectedVersion = this.version?.version;
      const isWindows = currentCluster.providerOs === 'windows';
      const out = [];

      versions.forEach((version) => {
        const nue = {
          label:      version.version,
          shortLabel: version.version.length > 16 ? `${ version.version.slice(0, 15) }...` : version.version,
          id:         version.version,
          created:    version.created,
          disabled:   false,
          keywords:   version.keywords
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
        if (!semver.valid(version.version)) {
          nue.version = semver.clean(version.version, { loose: true });
        }

        if (!this.showPreRelease && !!semver.prerelease(version.version)) {
          return;
        }

        out.push(nue);
      });

      const selectedMatch = out.find(v => v.id === selectedVersion);

      if (!selectedMatch) {
        out.push({ value: selectedVersion, label: this.t('catalog.install.versions.current', { ver: selectedVersion }) });
      }

      return out;
    },

    filteredVersions() {
      return this.showPreRelease ? this.mappedVersions : this.mappedVersions.filter(v => !v.isPre);
    },

    maintainers() {
      return this.version.maintainers.map((m) => {
        return {
          id:   m.name,
          text: m.name,
          url:  `mailto:${ m.email }`
        };
      });
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

    forced() {
      return this.$route.query[FORCE] === _FLAGGED;
    }
  },

  methods: {
    async baseFetch() {
      await this.$store.dispatch('catalog/load');

      if ( !this.chart ) {
        return;
      }

      if ( !this.query.versionName && this.chart.versions?.length ) {
        this.query.versionName = this.chart.versions[0].version;
      }

      if ( !this.query.versionName ) {
        return;
      }

      this.version = this.$store.getters['catalog/version']({
        repoType:      this.query.repoType,
        repoName:      this.query.repoName,
        chartName:     this.query.chartName,
        versionName: this.query.versionName
      });

      try {
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:      this.query.repoType,
          repoName:      this.query.repoName,
          chartName:     this.query.chartName,
          versionName: this.query.versionName
        });
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
        this.versionInfo = null;
      }
    },

    selectVersion({ id: version }) {
      this.$router.applyQuery({ [VERSION]: version });
    },

  },

};
