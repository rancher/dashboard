<script>
import { mapGetters } from 'vuex';
import throttle from 'lodash/throttle';

import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { WINDOWS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';

import { isPrerelease } from '@shell/utils/version';
import { set } from '@shell/utils/object';
import { defaultCmdOpts as defaultOpts } from '@shell/pages/c/_cluster/apps/charts/install.vue';

/**
 * Assumptions made by this component
 * If not in a cluster context, you want to install things in the mgmt cluster
 * You want to use the latest non-pre-release version of the chart
 * You want global values (rancher values) configured just as they would be when using the full install experience
 * Slots:
 * errors - this component doesn't render errors but it tracks them and provides a slot for the parent component to render errors if needed
 * cant install - rendered when the user can't create repos or cant see app resources or cant do the install action on the target repo
 * ready to install - rendered when  a chart is available and the user appears to have permission to install it; this slot lets parent components expose some values customization
 */

const defaultCmdOpts = { ...defaultOpts, timeout: '600s' };

const MAX_TRIES = 5;
const RETRY_WAIT = 500;

export default {
  name: 'InstallHelmCharts',

  components: { AsyncButton, Loading },

  emits: ['done'],

  props: {
    // vuex store  management or cluster
    store: {
      type:    String,
      default: 'cluster'
    },

    chartName: {
      type:     String,
      required: true
    },

    repoUrl: {
      type:     String,
      required: true
    },

    repoName: {
      type:     String,
      required: true
    },

    repoType: {
      type:    String,
      default: 'cluster'
    },

    // if not set will use chart targetNamespace. If neither this prop nor chart's targetNamespace are defined, will use default
    targetNamespace: {
      type:    String,
      default: null
    },

    // consuming component can supply some values to merge with chart values
    extraValues: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    // how long in ms to show a done/success label between each step
    delay: {
      type:    Number,
      default: 1000
    },

    chartDisplayName: {
      type:    String,
      default: null
    },

    repoDisplayName: {
      type:    String,
      default: null
    }

  },

  async fetch() {
    // check if the user can even load repos
    const repoSchema = this.$store.getters[`${ this.store }/schemaFor`](CATALOG.CLUSTER_REPO);

    if (repoSchema && repoSchema?.resourceActions?.install) {
      this.canCreateRepos = true;

      this.throttledRefreshCharts = throttle(() => {
        try {
          this.$store.dispatch('catalog/load', { force: true });
        } catch (e) {
          this.$store.dispatch('growl/fromError', { err: e });
        }
      }, 500, { trailing: false });

      if (!this.targetRepo || !this.chart) {
        this.throttledRefreshCharts();
      }

      // server url and project ids are used in global values
      try {
        this.serverUrlSetting = await this.$store.dispatch(`${ this.store }/find`, {
          type: MANAGEMENT.SETTING,
          id:   SETTING.SERVER_URL,
        });
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
      }

      await this.$store.dispatch(`${ this.store }/findAll`, { type: MANAGEMENT.PROJECT });
    }
  },

  data() {
    const repo = this.repoDisplayName || this.repoName;
    const chart = this.chartDisplayName || this.chartName;
    const stageNames = {
      ADD_REPO:    'addRepo',
      LOAD_CHARTS: 'loadCharts',
      INSTALL:     'install',
      WAIT:        'waitForLogs'
    };

    return {
      throttledRefreshCharts: null,

      // check the cluster repo schema
      canCreateRepos: false,

      serverUrlSetting: null,
      versionInfo:      null,
      userValues:       {},
      // payload for 'install' action on clusterrepo resource
      // contains array of chart install info as well as some helm install opts that are set by default in the regular chart install ui
      installCmd:       { charts: [], ...defaultCmdOpts },

      // disable the button and show a loading spinner while
      // creating repo
      // fetching charts from the repo
      // making the 'install' api call
      // waiting for logs
      doingButtonAction: false,

      loadingCharts:  false,
      waitingForLogs: false,

      // app has been installed, either by this component or elsewhere
      isInstalled:      false,
      //  app installation has been initiated  by this component
      didInstall:       false,
      installedVersion: '',

      installOperationName:      '',
      installOperationNamespace: '',
      operation:                 {}, // crd used to view helm install logs
      logsReady:                 false,
      stageNames,
      stages:                    {
        [stageNames.ADD_REPO]: {
          actionLabel:  this.t('catalog.install.button.stages.addRepo.action', { repo }),
          waitingLabel: this.t('catalog.install.button.stages.addRepo.waiting', { repo }),
          successLabel: this.t('catalog.install.button.stages.addRepo.success', { repo }),
          errorLabel:   this.t('catalog.install.button.stages.addRepo.error', { repo }),
          action:       this.addRepository
        },
        [stageNames.LOAD_CHARTS]: {
          actionLabel:  this.t('catalog.install.button.stages.loadCharts.action', { repo }),
          waitingLabel: this.t('catalog.install.button.stages.loadCharts.waiting', { repo }),
          successLabel: this.t('catalog.install.button.stages.loadCharts.success', { chart }),
          errorLabel:   this.t('catalog.install.button.stages.loadCharts.error', { chart }),
          action:       this.fetchRepoCharts
        },
        // using action label for 'success' here  and in waitForLogs to hack around a timing issue where the success message briefly shows
        [stageNames.INSTALL]: {
          actionLabel:  this.t('catalog.install.button.stages.installChart.action', { chart }),
          waitingLabel: this.t('catalog.install.button.stages.installChart.waiting', { chart }),
          successLabel: this.t('catalog.install.button.stages.installChart.action', { chart }),
          errorLabel:   this.t('catalog.install.button.stages.installChart.error', { chart }),
          action:       this.installChart
        },
        [stageNames.WAIT]: {
          actionLabel:  this.t('catalog.install.button.stages.waitForLogs.action', { chart }),
          waitingLabel: this.t('catalog.install.button.stages.waitForLogs.waiting', { chart }),
          successLabel: this.t('catalog.install.button.stages.waitForLogs.action', { chart }),
          errorLabel:   this.t('catalog.install.button.stages.waitForLogs.error', { chart }),
          action:       () => this.logsReady ? this.openLogs() : this.waitForLogs()
        }
      },

      errors: [],
      btnCb:  () => {}
    };
  },

  watch: {
    targetRepo: {
      handler(neu) {
        if (neu) {
          if (!this.chart) {
            this.doingButtonAction = true;
            this.fetchRepoCharts();
          }
        }
      },
      immediate: true
    },

    chart: {
      handler(neu) {
        if (neu) {
          this.fetchVersionInfo();
        }
      },
      immediate: true
    },

    versionInfo(neu) {
      this.checkIfInstalled();

      const { chart: chartInfo } = neu;

      this.installCmd.charts[0] = {
        chartName:   this.chartName,
        releaseName: chartInfo.name,
        version:     chartInfo.version,
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.repoName
        },

      };

      this.installCmd.namespace = this.targetNamespace || this.chart?.targetNamespace || 'default';
    }
  },

  methods: {
    async addRepository() {
      this.errors = [];
      this.doingButtonAction = true;

      try {
        const repoObj = await this.$store.dispatch(`${ this.store }/create`, {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: this.repoName },
          spec:     { url: this.repoUrl },
        });

        try {
          await repoObj.save();
        } catch (e) {
          this.$store.dispatch('growl/fromError', { err: e });

          this.errors.push(e);
          this.doingButtonAction = false;

          this.btnCb(false);

          return;
        }

        this.throttledRefreshCharts();
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });

        this.errors.push(e);
        this.doingButtonAction = false;

        this.btnCb(false);
      }
    },

    // it takes time to fetch a repo's charts when the repo resource is created
    // so we retry loading the chart info using the "refresh" clusterrepo model action
    async fetchRepoCharts() {
      this.doingButtonAction = true;
      let tries = 0;

      while (tries < MAX_TRIES) {
        try {
          tries++;
          await this.targetRepo.refresh();
          if (this.chart) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
        } catch (err) {
          // some errors here are expected
          // we only show error state when while block finishes and still no chart found
        }
      }

      // tried all our tries and the chart still isn't found - tell users something has gone wrong
      if (!this.chart) {
        this.btnCb(false);
        this.$store.dispatch('growl/fromError', { err: this.t('catalog.install.button.errors.fetchChart') });

        this.doingButtonAction = false;
      } else {
        this.btnCb(true);
      }
    },

    // once a chart is located fetch installation info from the repo
    async fetchVersionInfo() {
      try {
        // assume we want the latest non-prerelease version
        const targetVersion = (this.chart?.versions || []).find((v) => v.version && !isPrerelease(v.version))?.version;

        if (!targetVersion) {
          return;
        }
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:    this.repoType,
          repoName:    this.repoName,
          chartName:   this.chartName,
          versionName: targetVersion
        });
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
        this.errors.push(e);
        this.doingButtonAction = false;
      }
    },

    /**
     * Check if the chart is already installed
     * also check if the user can install charts generally, and can install charts from this repo
     * If the chart has provides-gvr annotation, check that
     * if no gvr annotation, look for an app with id targetNamespce/targetName
     * if app is found, tell the user which version is installed
     */
    async checkIfInstalled() {
      const chartInfo = this.versionInfo?.chart || {};

      if (chartInfo.annotations?.[CATALOG_ANNOTATIONS.PROVIDES]) {
        this.isInstalled = this.$store.getters['catalog/isInstalled']({ gvr: chartInfo?.annotations?.[CATALOG_ANNOTATIONS.PROVIDES] });
      } else {
        const appSchema = this.$store.getters[`${ this.store }/schemaFor`](CATALOG.APP);

        if (!appSchema) {
          this.canInstallChart = false;
        } else {
          try {
            const app = await this.$store.dispatch(`${ this.store }/find`, { type: CATALOG.APP, id: `${ this.targetNamespace || this.chart?.targetNamespace || 'default' }/${ this.chartName }` });

            if (app) {
              this.installedVersion = app?.spec?.chart?.metadata?.appVersion;
              this.isInstalled = true;
            }
          } catch {
          }
        }
      }

      this.doingButtonAction = false;
    },

    async installChart() {
      this.doingButtonAction = true;
      this.errors = [];

      if (this.isInstalled) {
        this.doingButtonAction = false;

        this.errors.push(this.t('catalog.install.button.errors.alreadyInstalled'));
        this.$store.dispatch('growl/fromError', { err: this.t('catalog.install.button.errors.alreadyInstalled') });

        return;
      }
      let res;

      try {
        this.didInstall = true;
        // should only be values that differ from default
        this.installCmd.charts[0].values = {
          ...this.getGlobalValues(), ...this.extraValues, ...this.userValues
        };
        res = await this.targetRepo.doAction('install', this.installCmd);
      } catch (err) {
        this.btnCb(false);
        this.errors.push(err);
        this.doingButtonAction = false;

        return;
      }

      this.installOperationName = res.operationName;
      this.installOperationNamespace = res.operationNamespace;
      await this.waitForLogs();
      this.btnCb(true);

      setTimeout(() => this.$emit('done', { namespace: res.operationNamespace, name: res.operationName }), this.delay);
    },

    // find the helm operation and check if logs  are available
    async waitForLogs() {
      const { installOperationName, installOperationNamespace } = this;
      const operationId = `${ installOperationNamespace }/${ installOperationName }`;

      await this.targetRepo.waitForOperation(operationId);

      this.operation = await this.$store.dispatch(`${ this.store }/find`, {
        type: CATALOG.OPERATION,
        id:   operationId
      });

      try {
        await this.operation.waitForLink('logs');
        this.logsReady = true;
        this.doingButtonAction = false;
      } catch (e) {
        // The wait times out eventually, move on...
        this.doingButtonAction = false;
        this.errors.push(this.t('catalog.install.button.errors.timeoutWaiting'));
        this.$store.dispatch('growl/fromError', { err: this.t('catalog.install.button.errors.timeoutWaiting') });
      }
    },

    // set some global values based off the target cluster's configuration
    getGlobalValues() {
      let clusterId = '';
      let clusterName = '';

      if (this.currentCluster) {
        clusterId = this.currentCluster?.id;
        clusterName = this.currentCluster.nameDisplay;
      } else {
        clusterId = 'local';
        clusterName = 'local';
      }

      const serverUrl = this.serverUrlSetting?.value || '';
      const rkePathPrefix = this.currentCluster?.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const rkeWindowsPathPrefix = this.currentCluster?.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';
      const isWindows = (this.currentCluster?.workerOSs || []).includes(WINDOWS);

      const projects = this.$store.getters[`${ this.store }/all`](MANAGEMENT.PROJECT);

      const systemProjectId = projects.find((p) => p.spec?.chartDisplayName === 'System')?.id?.split('/')?.[1] || '';

      const values = {
        global: {
          cattle: {
            clusterName,
            clusterId,
            url: serverUrl,
            rkePathPrefix,
            rkeWindowsPathPrefix,
            systemProjectId
          }
        }
      };

      if (isWindows) {
        values.global.cattle.windows = { enabled: true };
      }

      return values;
    },

    // this method is passed to a slot parent components can use to expose some chart configuration options
    setValue(key, val) {
      set(this.userValues, key, val);
    },

    openLogs() {
      this.operation.openLogs();
      this.btnCb(true);
    },

    // go to the full chart install/upgrade experience
    goToInstall() {
      if (!this.chart) {
        return;
      }
      this.chart.goToInstall(null, 'local');
    }
  },

  computed: {
    ...mapGetters({
      charts: 'catalog/charts',
      repos:  'catalog/repos',
      t:      'i18n/t'
    }),

    currentCluster() {
      const storeCluster = this.$store.getters['currentCluster'];

      if (storeCluster) {
        return storeCluster;
      }

      return this.$store.getters[`management/byId`](MANAGEMENT.CLUSTER, 'local' );
    },

    chart() {
      if (this.targetRepo) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.repoName,
          repoType:  this.repoType,
          chartName: this.chartName
        });
      }

      return null;
    },

    targetRepo() {
      return this.$store.getters['catalog/repo']({ repoType: this.repoType, repoName: this.repoName });
    },

    canInstallChart() {
      const appSchema = this.$store.getters[`${ this.store }/schemaFor`](CATALOG.APP);

      return appSchema && this.targetRepo && this.targetRepo?.actions?.install;
    },

    /**
     * Determine what set of labels and what action to use with the button depending on what catalog resources the component has available
     * There are 4 stages of chart installation:
     * creating the repo
     * getting charts from the repo + configuring the chart
     * initializing the installation and waiting for logs
     * offering logs
     */
    buttonStage() {
      if (!this.targetRepo) {
        return this.stageNames.ADD_REPO;
      }

      if (!this.chart || (!this.didInstall && this.doingButtonAction)) {
        return this.stageNames.LOAD_CHARTS;
      }

      if (!this.installOperationName) {
        return this.stageNames.INSTALL;
      }

      return this.stageNames.WAIT;
    },

    // at each stage of installing the chart, the button may be in one of 3 states
    // action (blue, ready to be clicked)
    // waiting (disabled with a loading spinner, doing the thing it was clicked to do)
    // error  (red, re-enabled, showing generic error label)
    buttonPhase() {
      if (this.errors.length) {
        return 'error';
      }

      if (this.doingButtonAction) {
        return 'waiting';
      }

      return 'action';
    },

    // the user has permission to install charts, the chart has been found, and it has not been installed already
    readyToInstall() {
      return this.canInstallChart && !this.isInstalled && this.chart && !this.doingButtonAction && this.buttonStage === this.stageNames.INSTALL;
    },
  },

}
;
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <!-- the user doesn't have permission either to create repos or install charts generally or install from this repo -->
  <div v-else-if="!canCreateRepos && !doingButtonAction">
    <slot name="cant-install">
      <span>{{ t('catalog.install.button.canNotCreateRepos', ) }}</span>
    </slot>
  </div>
  <div v-else-if="!canInstallChart && !doingButtonAction && targetRepo">
    <slot name="cant-install">
      <span>{{ t('catalog.install.button.canNotInstallApps', {repo: repoName} ) }}</span>
    </slot>
  </div>

  <!-- the chart is already installed -->
  <div
    v-else-if="isInstalled && !installOperationName"
  >
    <span>{{ t('catalog.install.button.alreadyInstalled', {chart: chartName, version: installedVersion}) }}
      <a
        aria-label="go to chart installation page"
        @click="goToInstall"
      >
        {{ t('catalog.install.button.viewDetails') }}
      </a>
    </span>
  </div>

  <div v-else>
    <div
      v-if="readyToInstall"
    >
      <!-- the chart is ready to be installed, and installation has not yet begun -->
      <slot
        :set-value="setValue"
        :values="userValues"
        name="values"
      />
    </div>
    <div v-if="errors && errors.length">
      <slot
        :errors="errors"
        name="errors"
      />
    </div>
    <AsyncButton
      v-if="canCreateRepos && buttonStage === stageNames.ADD_REPO || canInstallChart && buttonStage !== stageNames.ADD_REPO"
      :current-phase="buttonPhase"
      :action-label="stages[buttonStage].actionLabel"
      :waiting-label="stages[buttonStage].waitingLabel"
      :success-label="stages[buttonStage].successLabel"
      :error-label="stages[buttonStage].errorLabel"
      :delay="delay"
      type="button"
      class="btn role-primary"
      @click="cb=>{btnCb=cb;stages[buttonStage].action()}"
    />
    <div>
      <button
        v-if="readyToInstall"
        type="button"
        class="btn btn-sm role-link"
        @click="goToInstall"
      >
        {{ t('catalog.install.button.customizeInstall') }}
      </button>
    </div>
  </div>
</template>
