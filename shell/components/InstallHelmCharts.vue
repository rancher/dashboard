<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { WINDOWS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import Banner from '@components/Banner/Banner.vue';

import AsyncButton from '@shell/components/AsyncButton';
import { isPrerelease } from '@shell/utils/version';
import { nextTick } from 'vue';
import { set } from '@shell/utils/object';
import { defaultCmdOpts } from '@shell/pages/c/_cluster/apps/charts/install.vue';

/**
 * Assumptions made by this component
 * If not in a cluster context, you want to install things in the mgmt cluster
 * You want to use the latest non-pre-release version of the chart
 * You want global values (rancher values) configured just as they would be when using the full install experience
 * Consuming component is responsible for determining:
 *  - if the app is already installed
 *  - if the user has permission to install apps
 */

const MAX_TRIES = 5;
const RETRY_WAIT = 500;

export default {
  name: 'InstallHelmCharts',

  components: { AsyncButton, Banner },

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

    displayName: {
      type:    String,
      default: null
    }

  },

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      try {
        this.$store.dispatch('catalog/load', { force: true });
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
      }
    }, 500);

    if (!this.targetRepo || !this.chart) {
      this.debouncedRefreshCharts(true);
    }

    try {
      this.serverUrlSetting = await this.$store.dispatch(`${ this.store }/find`, {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SERVER_URL,
      });
    } catch (e) {
      console.error('Unable to fetch `server-url` setting: ', e); // eslint-disable-line no-console
    }

    await this.$store.dispatch(`${ this.store }/findAll`, { type: MANAGEMENT.PROJECT });
  },

  data() {
    return {
      serverUrlSetting:          null,
      debouncedRefreshCharts:    null,
      versionInfo:               null,
      versionInfoError:          null,
      userValues:                {},
      // payload for 'install' action on clusterrepo resource
      // contains array of chart install info as well as some helm install opts that are set by default in the regular chart install ui
      installCmd:                { charts: [], ...defaultCmdOpts },
      // 'operation' is crd used to view helm install logs
      // name and ns returned from 'install' api call
      installOperationName:      '',
      installOperationNamespace: '',
      operation:                 {},
      logsReady:                 false,

      // TODO nb localize
      stages: {
        addRepo: {
          actionLabel:  `Install ${ this.displayName || this.chartName }`,
          waitingLabel: `Adding ${ this.repoName } repository...`,
          successLabel: 'Repository Added',
          errorLabel:   `Error Adding ${ this.repoName } repository`,
          loading:      false,
          done:         false,
          errors:       []
        },
        loadCharts: {
          actionLabel:  `Fetch ${ this.repoName } repository chart(s)`,
          waitingLabel: `Fetching ${ this.repoName } respository chart(s)...`,
          successLabel: 'Charts found',
          errorLabel:   'Chart not found - Try Again',
          loading:      false,
          done:         false,
          errors:       []
        },
        configureChart: {
          actionLabel:  `Install ${ this.displayName || this.chartName }`,
          waitingLabel: `Installing ${ this.displayName || this.chartName }...`,
          successLabel: 'Installed',
          errorLabel:   'Error Installing Chart',
          loading:      false,
          done:         false,
          errors:       []
        },
        installChart: {
          actionLabel:  `Install ${ this.displayName || this.chartName }`,
          waitingLabel: `Installing ${ this.displayName || this.chartName }...`,
          successLabel: `${ this.displayName || this.chartName } Installation Initialized`,
          errorLabel:   `Error Installing ${ this.displayName || this.chartName }...`,
          loading:      false,
          done:         false,
          errors:       []
        }
      },
      btnCb: () => {}
    };
  },

  watch: {
    targetRepo: {
      handler(neu) {
        if (neu) {
          this.stages.addRepo.done = true;
          this.stages.addRepo.errors = '';

          if (!this.chart) {
            this.fetchRepoCharts();
          }
        }
      },
      immediate: true
    },

    chart: {
      handler(neu) {
        if (neu) {
          this.stages.loadCharts.done = true;
          this.stages.loadCharts.errors = '';
          this.fetchVersionInfo();
        }
      },
      immediate: true
    },

    versionInfo(neu) {
      const { chart: chartInfo } = neu;

      this.installCmd.charts[0] = {
        chartName:   this.chartName,
        releaseName: chartInfo.name,
        version:     chartInfo.version,
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.repoName
        },
        // this only needs to be values that differ from the default
        values: {
          ...this.getGlobalValues(), ...this.extraValues, ...this.userValues
        }
      };

      this.installCmd.namespace = this.targetNamespace || this.chart?.targetNamespace || 'default';
    }
  },

  methods: {
    async addRepository() {
      this.stages.addRepo.loading = true;
      this.stages.addRepo.error = null;

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
          this.stages.addRepo.loading = false;

          this.stages.addRepo.error = e;

          this.btnCb(false);

          return;
        }

        this.stages.addRepo.loading = false;
        this.stages.addRepo.done = true;
        this.stages.loadCharts.loading = true;
        this.stages.loadCharts.error = '';
        await nextTick();
        this.debouncedRefreshCharts();
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
        this.stages.addRepo.loading = false;

        this.stages.addRepo.error = e;
        this.btnCb(false);
      }
    },

    // it takes time to fetch a repo's charts when the repo resource is created
    // so we retry loading the chart info using the "refresh" clusterrepo model action
    async fetchRepoCharts() {
      this.stages.loadCharts.loading = true;
      this.stages.loadCharts.error = '';

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
          console.error(err);
        }
      }

      this.stages.loadCharts.loading = false;

      // tried all our tries and the chart still isn't found - tell users something has gone wrong
      if (!this.chart) {
        this.btnCb(false);

        this.stages.loadCharts.error = `Unable to locate the ${ this.chartName } chart in the ${ this.repoName } repository`;
      } else {
        this.btnCb(true);

        this.stages.loadCharts.done = true;
      }
    },

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
        // TODO nb growl?
        this.versionInfoError = e;

        console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
      }
    },

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

      const systemProjectId = projects.find((p) => p.spec?.displayName === 'System')?.id?.split('/')?.[1] || '';

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

    async installChart(btnCb = () => {}) {
      this.stages.installChart.loading = true;

      if (this.stages.installChart.done) {
        this.stages.installChart.loading = false;

        this.stages.installChart.error = 'Chart already installed';

        return;
      }
      let res;

      try {
        res = await this.targetRepo.doAction('install', this.installCmd);
      } catch (err) {
        // TODO nb growl?
        console.error(err);
        this.btnCb(false);

        this.stages.installChart.loading = false;

        this.stages.installChart.error = err;
      }

      // this.btnCb(true);
      this.stages.installChart.loading = false;
      this.stages.installChart.done = true;
      this.installOperationName = res.operationName;
      this.installOperationNamespace = res.operationNamespace;

      await this.waitForLogs();
      this.btnCb(true);

      setTimeout(() => this.$emit('done', { namespace: res.operationNamespace, name: res.operationName }), this.delay);
    },

    setValue(key, val) {
      set(this.userValues, key, val);
    },

    // find the helm operation and check if logs  are available
    async waitForLogs() {
      const { installOperationName, installOperationNamespace } = this;
      const operationId = `${ installOperationNamespace }/${ installOperationName }`;

      // Non-admins without a cluster won't be able to fetch operations immediately
      await this.targetRepo.waitForOperation(operationId);

      // Dynamically use store decided when loading catalog (covers standard user case when there's not cluster)
      this.operation = await this.$store.dispatch(`${ this.store }/find`, {
        type: CATALOG.OPERATION,
        id:   operationId
      });

      try {
        await this.operation.waitForLink('logs');
        this.logsReady = true;
      } catch (e) {
        // The wait times out eventually, move on...
      }
    },

    openLogs() {
      this.operation.openLogs();
    },
  },

  computed: {
    // ...mapGetters(['currentCluster']),
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

    /**
       * [!IMPORTANT]
       * TODO:
       * THIS IS BROKEN
       * When installing, if you add the repo and leave the page
       * then come back, the controllerChart will be null, but so will
       * the targetRepo. This is because the repo is not saved to the store?
       * TODO nb
       */
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

    // label the async button depending on form stage
    /** set button currentPhase to one of xLabel
     *   actionLabel: {
      type:    String,
      default: null,
    },
    waitingLabel: {
      type:    String,
      default: null,
    },
    successLabel: {
      type:    String,
      default: null,
    },
    errorLabel: {
      type:    String,
      default: null,
    },

     */
    buttonLabel() {
      const {
        addRepo, loadCharts, configureChart, installChart
      } = this.stages;

      const pStages = [installChart, configureChart, loadCharts, addRepo];

      // start w/ add repo label
      const out = {
        actionLabel:  addRepo.actionLabel,
        waitingLabel: addRepo.waitingLabel,
        successLabel: addRepo.successLabel,
        errorLabel:   addRepo.errorLabel,
        phase:        'action',
        action:       this.addRepository

      };

      const errorStage = pStages.find((s) => s?.error && s?.error?.length);

      if (errorStage) {
        out.phase = 'error';
        out.waitingLabel = errorStage.errorLabel;
        out.errorLabel = errorStage.errorLabel;
        out.error = errorStage.error;

        if (errorStage === loadCharts) {
          out.action = () => {
            if (!this.chart) {
              this.fetchRepoCharts();
            } else {
              this.fetchVersionInfo();
            }
          };
        }

        return out;
      }

      // Find latest loading stage
      const loadingStage = pStages.find((s) => s?.loading);

      if (loadingStage) {
        out.phase = 'waiting';
        out.waitingLabel = loadingStage.waitingLabel;
        out.actionLabel = loadingStage.waitingLabel;
        out.successLabel = loadingStage.successLabel;

        return out;
      }

      const nextStageI = pStages.findIndex((s) => s?.done) - 1;

      if (nextStageI >= 0 && pStages[nextStageI]) {
        const nextStage = pStages[nextStageI];

        out.phase = 'action';
        out.actionLabel = nextStage.actionLabel;
        out.waitingLabel = nextStage.waitingLabel;
        out.successLabel = nextStage.successLabel;

        if (nextStage === configureChart || nextStage === installChart) {
          out.action = this.installChart;

          return out;
        }
        if (nextStage === loadCharts) {
          out.phase = 'waiting';
          out.action = () => {
            if (!this.chart) {
              this.fetchRepoCharts();
            } else {
              this.fetchVersionInfo();
            }
          };
        }

        return out;
        // nothing is in error, nothing is loading, nothing is done - show first step
      } else {
        return {
          actionLabel:  addRepo.actionLabel,
          waitingLabel: addRepo.waitingLabel,
          successLabel: addRepo.successLabel,
          errorLabel:   addRepo.errorLabel,
          phase:        'action',
          action:       this.addRepository

        };
      }
    },

    errors() {
      return this.buttonLabel.errors;
    },

  },

}
;
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-if=" stages.installChart.done">
    <button
      class="btn btn-sm role-secondary"
      type="button"
      @click="openLogs"
    >
      view helm logs
    </button>
  </div>
  <div v-else>
    <div v-if="stages.loadCharts.done && chart && !( stages.installChart.loading || stages.installChart.done )">
      <!-- shown when a chart is ready to be installed, and installation has not yet begun -->
      <slot
        :set-value="setValue"
        :values="userValues"
        name="values"
      />
    </div>
    <div v-if="errors">
      <slot
        :errors="errors"
        name="errors"
      >
        <Banner
          color="error"
          :label="errors"
        />
      </slot>
    </div>
    <!-- click event's callback function is stored in a data prop to be triggerd by different component methods -->
    <!-- 'current phase' sets color, enabled/disabled, spinner -->
    <AsyncButton
      :current-phase="buttonLabel.phase"
      :action-label="buttonLabel.actionLabel"
      :waiting-label="buttonLabel.waitingLabel"
      :success-label="buttonLabel.successLabel"
      :error-label="buttonLabel.errorLabel"
      :delay="delay"
      type="button"
      class="btn role-primary"
      @click="cb=>{btnCb=cb;buttonLabel.action()}"
    />
  </div>
</template>
