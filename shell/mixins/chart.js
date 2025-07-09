
import { mapGetters } from 'vuex';

import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, DEPRECATED as DEPRECATED_QUERY, HIDDEN, _FLAGGED, _CREATE, _EDIT
} from '@shell/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SHOW_PRE_RELEASE, mapPref } from '@shell/store/prefs';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { OPA_GATE_KEEPER_ID } from '@shell/pages/c/_cluster/gatekeeper/index.vue';

import { formatSi, parseSi } from '@shell/utils/units';
import { CAPI, CATALOG } from '@shell/config/types';
import { isPrerelease } from '@shell/utils/version';
import difference from 'lodash/difference';
import { LINUX, APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { clone } from '@shell/utils/object';
import { merge } from 'lodash';

export default {
  data() {
    return {
      version:          null,
      versionInfo:      null,
      versionInfoError: null,
      existing:         null,

      ignoreWarning: false,

      chart: null,
    };
  },

  computed: {
    ...mapGetters(['currentCluster', 'isRancher']),

    showPreRelease: mapPref(SHOW_PRE_RELEASE),

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
      const versions = this.chart?.versions || [];
      const selectedVersion = this.targetVersion;
      const OSs = this.currentCluster?.workerOSs;
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

        const permittedSystems = (version?.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).split(',');

        if (permittedSystems.length > 0 && difference(OSs, permittedSystems).length > 0) {
          nue.disabled = true;
        }
        // if only one OS is allowed, show '<OS>-only' on hover
        if (permittedSystems.length === 1) {
          nue.label = this.t(`catalog.install.versions.${ permittedSystems[0] }`, { ver: version.version });
        }

        if (!this.showPreRelease && isPrerelease(version.version)) {
          return;
        }

        out.push(nue);
      });

      const selectedMatch = out.find((v) => v.id === selectedVersion);

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

      const currentVersion = out.find((v) => v.originalVersion === this.currentVersion);

      if (currentVersion) {
        currentVersion.label = this.t('catalog.install.versions.current', { ver: this.currentVersion });
      }

      return out;
    },

    // Conditionally filter out prerelease versions of the chart.
    filteredVersions() {
      return this.showPreRelease ? this.mappedVersions : this.mappedVersions.filter((v) => !v.isPre);
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
        description:  query[DESCRIPTION_QUERY],
        hidden:       query[HIDDEN],
        deprecated:   query[DEPRECATED_QUERY]
      };
    },

    showDeprecated() {
      return this.query.deprecated === 'true' || this.query.deprecated === _FLAGGED;
    },

    showHidden() {
      return this.query.hidden === _FLAGGED;
    },

    // If the user is installing the app for the first time,
    // warn them about CPU and memory requirements.
    warnings() {
      const warnings = [];

      if ( this.existing ) {
        // Ignore the limits on upgrade (or if asked by query) and don't show any warnings
      } else {
        // The UI will show warnings about CPU and memory if
        // these annotations are added to Helm chart:
        // - catalog.cattle.io/requests-cpu
        // - catalog.cattle.io/requests-memory
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

      if (this.chart?.id === OPA_GATE_KEEPER_ID) {
        warnings.unshift(this.t('gatekeeperIndex.deprecated', {}, true));
      }

      if (this.existing && this.existing.upgradeAvailable === APP_UPGRADE_STATUS.NOT_APPLICABLE) {
        const manager = this.existing?.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MANAGED] || 'Rancher';

        warnings.unshift(this.t('catalog.install.warning.managed', {
          name:    this.existing.name,
          version: this.chart ? this.query.versionName : null,
          manager: manager === 'true' ? 'Rancher' : manager
        }, true));
      }

      return warnings;
    },

    requires() {
      const requires = [];

      const required = (this.version?.annotations?.[CATALOG_ANNOTATIONS.REQUIRES_GVK] || '').split(/\s*,\s*/).filter((x) => !!x).reverse();

      if ( required.length ) {
        for ( const gvr of required ) {
          if ( this.$store.getters['catalog/isInstalled']({ gvr }) ) {
            continue;
          }

          const provider = this.provider(gvr);

          if ( provider ) {
            const url = this.$router.resolve(this.chartLocation(true, provider)).href;

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
    /**
     * Populate `this.chart`
     *
     * `chart` used to be a computed property pointing at getter catalog/chart
     *
     * this however stopped recalculating given changes to the store
     *
     * (the store would populate a charts collection, which the getter uses to find the chart,
     * however this did not kick off the computed property, so this.charts was not populated)
     *
     * Now we find and cache the chart
     */
    fetchStoreChart() {
      if (!this.chart && this.repo && this.query.chartName) {
        this.chart = this.$store.getters['catalog/chart']({
          repoType:       this.query.repoType,
          repoName:       this.query.repoName,
          chartName:      this.query.chartName,
          includeHidden:  true,
          showDeprecated: this.showDeprecated
        });
      }

      return this.chart;
    },

    async fetchChart() {
      this.versionInfoError = null;

      await this.$store.dispatch('catalog/load'); // not the problem

      this.fetchStoreChart();

      if ( this.query.appNamespace && this.query.appName ) {
        // First check the URL query for an app name and namespace.
        // Use those values to check for a catalog app resource.
        // If found, set the form to edit mode. If not, set the
        // form to create mode.

        try {
          this.existing = await this.$store.dispatch('cluster/find', {
            type: CATALOG.APP,
            id:   `${ this.query.appNamespace }/${ this.query.appName }`,
          });

          await this.existing?.fetchValues(true);

          this.mode = _EDIT;
        } catch (e) {
          this.mode = _CREATE;
          this.existing = null;
        }
      } else if ( this.chart?.targetNamespace && this.chart?.targetName ) {
        // If the app name and namespace values are not provided in the
        // query, fall back on target values defined in the Helm chart itself.

        // Ask to install a special chart with fixed namespace/name
        // or edit it if there's an existing install.

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

      // If no version is given in the URL query,
      // use the first version provided by the Helm chart
      // as the default.
      if ( !this.query.versionName && this.chart.versions?.length ) {
        if (this.showPreRelease) {
          this.query.versionName = this.chart.versions[0].version;
        } else {
          const firstRelease = this.chart.versions.find((v) => !isPrerelease(v.version));

          this.query.versionName = firstRelease?.version || this.chart.versions[0].version;
        }
      }

      if ( !this.query.versionName ) {
        return;
      }

      try {
        this.version = this.$store.getters['catalog/version']({
          repoType:    this.query.repoType,
          repoName:    this.query.repoName,
          chartName:   this.query.chartName,
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
          repoType:    this.query.repoType,
          repoName:    this.query.repoName,
          chartName:   this.query.chartName,
          versionName: this.query.versionName
        });
        // Here we set us versionInfo. The returned
        // object contains everything all info
        // about a currently installed app, and it has the
        // following keys:
        //
        // - appReadme: A short overview of what the app does. This
        //   forms the first few paragraphs of the chart info when
        //   you install a Helm chart app through Rancher.
        // - chart: Metadata about the Helm chart, including the
        //   name and version.
        // - readme: This is more detailed information that appears
        //   under the heading "Chart Information (Helm README)" when
        //   you install or upgrade a Helm chart app through Rancher,
        //   below the app README.
        // - values: All Helm chart values for the currently installed
        //   app.
      } catch (e) {
        this.versionInfoError = e;

        console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
      }
    }, // End of fetchChart

    // Charts have an annotation that specifies any additional charts that should be installed at the same time eg CRDs
    async fetchAutoInstallInfo() {
      const out = [];
      /*
        An example value for auto is ["rancher-monitoring-crd=match"].
        It is an array of chart names that lets Rancher know of other
        charts that should be auto-installed at the same time.
      */
      const auto = (this.version?.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL] || '').split(/\s*,\s*/).filter((x) => !!x).reverse();

      for ( const constraint of auto ) {
        const provider = this.$store.getters['catalog/versionSatisfying']({
          constraint,
          repoName:     this.chart.repoName,
          repoType:     this.chart.repoType,
          chartVersion: this.version.version,
        });
        /* An example return value for "provider":
          [
              {
                  "name": "rancher-monitoring-crd",
                  "version": "100.1.3+up19.0.3",
                  "description": "Installs the CRDs for rancher-monitoring.",
                  "apiVersion": "v1",
                  "annotations": {
                      "catalog.cattle.io/certified": "rancher",
                      "catalog.cattle.io/hidden": "true",
                      "catalog.cattle.io/namespace": "cattle-monitoring-system",
                      "catalog.cattle.io/release-name": "rancher-monitoring-crd"
                  },
                  "type": "application",
                  "urls": [
                      "https://192.168.0.18:8005/k8s/clusters/c-m-hhpg69fv/v1/catalog.cattle.io.clusterrepos/rancher-charts?chartName=rancher-monitoring-crd&link=chart&version=100.1.3%2Bup19.0.3"
                  ],
                  "created": "2022-04-27T10:04:18.343124-07:00",
                  "digest": "ecf07ba23a9cdaa7ffbbb14345d94ea1240b7f3b8e0ce9be4640e3e585c484e2",
                  "key": "cluster/rancher-charts/rancher-monitoring-crd/100.1.3+up19.0.3",
                  "repoType": "cluster",
                  "repoName": "rancher-charts"
              }
          ]
          */

        if ( provider ) {
          try {
            const crdVersionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
              repoType:    provider.repoType,
              repoName:    provider.repoName,
              chartName:   provider.name,
              versionName: provider.version
            });
            let existingCRDApp;

            // search for an existing crd app to track any non-default values used on the previous install/upgrade
            if (this.mode === _EDIT) {
              const targetNamespace = crdVersionInfo?.chart?.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE];
              const targetName = crdVersionInfo?.chart?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME];

              if (targetName && targetNamespace) {
                existingCRDApp = await this.$store.dispatch('cluster/find', {
                  type: CATALOG.APP,
                  id:   `${ targetNamespace }/${ targetName }`,
                });
              }
            }
            if (existingCRDApp) {
              await existingCRDApp.fetchValues(true);

              // spec.values are any non-default values the user configured
              // the installation form should show these, as well as any default values from the chart
              const existingValues = clone(existingCRDApp.values || {});
              const defaultValues = clone(existingCRDApp.chartValues || {});

              crdVersionInfo.existingValues = existingValues;
              crdVersionInfo.allValues = merge(defaultValues, existingValues);
            } else {
              // allValues will potentially be updated in the UI - we want to track this separately from values to avoid mutating the chart object in the store
              // this is similar to userValues for the main chart
              crdVersionInfo.allValues = clone(crdVersionInfo.values);
            }

            out.push(crdVersionInfo);
          } catch (e) {
            console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
          }
        } else {
          this.errors.push(`This chart requires ${ constraint } but no matching chart was found`);
        }
      }

      this['autoInstallInfo'] = out;
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
    chartLocation(install = false, prov) {
      const provider = prov || {
        repoType: this.chart.repoType,
        repoName: this.chart.repoName,
        name:     this.chart.chartName,
        version:  this.query.versionName,
      };

      return {
        name:   install ? 'c-cluster-apps-charts-install' : 'c-cluster-apps-charts-chart',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
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
          product:  this.$store.getters['productId'],
          cluster:  this.$store.getters['clusterId'],
          resource: CATALOG.APP,
        }
      };
    },

    clusterToolsLocation() {
      return {
        name:   `c-cluster-explorer-tools`,
        params: {
          product:  EXPLORER,
          cluster:  this.$store.getters['clusterId'],
          resource: CATALOG.APP,
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
