<script>
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { UI_PLUGIN_NAMESPACE, isChartVersionHigher } from '@shell/config/uiplugins';
import Banner from '@components/Banner/Banner.vue';
import { SETTING } from '@shell/config/settings';
import { getPluginChartVersionLabel } from '@shell/utils/uiplugins';

// Note: This dialog handles installation, upgrade and downgrade of a plugin

export default {
  emits: ['close'],

  components: {
    AsyncButton,
    Banner,
    LabeledSelect
  },

  props: {
    /**
     * Plugin object
     */
    plugin: {
      type:     Object,
      default:  () => {},
      required: true
    },
    /**
     * The pre-selected version in the dropdown
     */
    initialVersion: {
      type:    String,
      default: null
    },
    /**
     * The action to perform (install, upgrade, downgrade)
     */
    action: {
      type:     String,
      default:  '',
      required: true
    },
    /**
     * Callback to update install status on extensions main screen
     */
    updateStatus: {
      type:     Function,
      default:  () => {},
      required: true
    },
    /**
     * Callback when modal is closed
     */
    closed: {
      type:     Function,
      default:  () => {},
      required: true
    },
    resources: {
      type:    Array,
      default: () => []
    },
    registerBackgroundClosing: {
      type:    Function,
      default: () => {}
    }
  },

  async fetch() {
    // Determine the currently installed version, if any
    if (this.plugin.installed) {
      this.currentVersion = this.plugin.installedVersion;
    }

    // Determine the initial version to select in the dropdown
    if (this.initialVersion) {
      this.version = this.initialVersion;
    } else if (this.action === 'upgrade') {
      // Upgrade to the latest version, so take the first version
      this.version = this.plugin?.installableVersions?.[0]?.version;
    } else if (this.action === 'downgrade') {
      const versions = this.plugin.installableVersions;
      const currentIndex = versions.findIndex((v) => v.version === this.currentVersion);

      if (currentIndex !== -1 && currentIndex < versions.length - 1) {
        // Select the version just below the current version
        this.version = versions[currentIndex + 1].version;
      }
    } else {
      // Default to the latest installable version for new installs
      this.version = this.plugin?.installableVersions?.[0]?.version;
    }

    // Fallback if no version could be determined
    if (!this.version) {
      this.version = this.plugin?.installableVersions?.[0]?.version;
    }

    this.busy = false;
    this.update = this.action !== 'install';

    this.defaultRegistrySetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   SETTING.SYSTEM_DEFAULT_REGISTRY,
    });
  },

  data() {
    return {
      currentVersion:         '',
      defaultRegistrySetting: null,
      busy:                   false,
      version:                '',
      update:                 false,
      chartVersionInfo:       null
    };
  },

  computed: {
    showVersionSelector() {
      return this.versionOptions?.length > 1;
    },

    versionOptions() {
      if (!this.plugin?.installableVersions) {
        return [];
      }

      // Don't allow upgrade/downgrade to current version by disabling the option
      return this.plugin.installableVersions.map((v) => {
        const isCurrent = v.version === this.currentVersion;

        return {
          label:    getPluginChartVersionLabel(v) + (isCurrent ? ` (${ this.t('plugins.labels.current') })` : ''),
          value:    v.version,
          disabled: isCurrent,
        };
      });
    },

    buttonMode() {
      if (this.action === 'install') {
        return 'install';
      }

      if (this.currentVersion && this.version) {
        if (isChartVersionHigher(this.version, this.currentVersion)) {
          return 'upgrade';
        }

        if (isChartVersionHigher(this.currentVersion, this.version)) {
          return 'downgrade';
        }
      }

      // Fallback for safety, though should not be reached if version is selected
      return this.action;
    },

    chartVersionLoadsWithoutAuth() {
      return this.chartVersionInfo?.values?.plugin?.noAuth;
    },

    returnFocusSelector() {
      return `[data-testid="extension-card-${ this.action }-btn-${ this.plugin?.name }"]`;
    },

    buttonIcon() {
      if (this.busy) {
        return '';
      }

      switch (this.buttonMode) {
      case 'install':
        return 'icon-plus';
      case 'upgrade':
        return 'icon-upgrade-alt';
      case 'downgrade':
        return 'icon-downgrade-alt';
      default:
        return '';
      }
    }
  },

  methods: {
    async loadVersionInfo() {
      try {
        this.busy = true;
        const plugin = this.plugin;

        // Find the version that the user wants to install
        const version = plugin.versions?.find((v) => v.version === this.version);

        if (!version) {
          this.busy = false;

          return;
        }

        this.chartVersionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:    version.repoType,
          repoName:    version.repoName,
          chartName:   plugin.chart.chartName,
          versionName: this.version,
        });
      } catch (e) {
      } finally {
        this.busy = false;
      }
    },

    closeDialog(result) {
      this.closed(result);
      this.$emit('close');
    },

    async install() {
      this.busy = true;

      const plugin = this.plugin;

      this.updateStatus(plugin.name, this.action);

      // Find the version that the user wants to install
      const version = plugin.versions?.find((v) => v.version === this.version);

      if (!version) {
        this.busy = false;

        return;
      }

      const image = this.chartVersionInfo?.values?.image?.repository || '';
      // is the image used by the chart in the rancher org?
      const isRancherImage = image.startsWith('rancher/');

      // See if there is already a plugin with this name
      let exists = false;

      try {
        const app = await this.$store.dispatch('management/find', {
          type: CATALOG.APP,
          id:   `${ UI_PLUGIN_NAMESPACE }/${ plugin.chart.chartName }`,
          opt:  { force: true },
        });

        exists = !!app;
      } catch (e) {}

      const repoType = version.repoType;
      const repoName = version.repoName;
      const repo = this.$store.getters['catalog/repo']({ repoType, repoName });

      const chart = {
        chartName:   plugin.chart.chartName,
        version:     this.version,
        releaseName: plugin.chart.chartName,
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: plugin.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: plugin.repoName
        },
        values: {}
      };

      // Pass in the system default registry property if set - only if the image is in the rancher org
      const defaultRegistry = this.defaultRegistrySetting?.value || '';

      if (isRancherImage && defaultRegistry) {
        chart.values.global = chart.values.global || {};
        chart.values.global.cattle = chart.values.global.cattle || {};
        chart.values.global.cattle.systemDefaultRegistry = defaultRegistry;
      }

      const input = {
        charts:    [chart],
        // timeout:   this.cmdOptions.timeout > 0 ? `${ this.cmdOptions.timeout }s` : null,
        // wait:      this.cmdOptions.wait === true,
        namespace: UI_PLUGIN_NAMESPACE,
      };

      // Helm action
      const action = (exists || this.update) ? 'upgrade' : 'install';

      try {
        const res = await repo.doAction(action, input);
        const operationId = `${ res.operationNamespace }/${ res.operationName }`;

        this.closeDialog(plugin);

        await repo.waitForOperation(operationId);

        await this.$store.dispatch(`management/find`, {
          type: CATALOG.OPERATION,
          id:   operationId
        });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   this.t('plugins.error.generic'),
          message: e.message ? e.message : e,
          timeout: 10000
        }, { root: true });

        this.closeDialog(plugin);
      }
    }
  },
  watch: {
    version() {
      this.chartVersionInfo = null;
      this.loadVersionInfo();
    }
  }
};
</script>

<template>
  <div class="plugin-install-dialog">
    <h4 class="mt-10">
      {{ t(`plugins.${ buttonMode }.title`, { name: `"${plugin?.label}"` }, true) }}
    </h4>
    <div class="custom mt-10">
      <div class="dialog-panel">
        <p>
          {{ t(`plugins.${ buttonMode }.prompt`) }}
        </p>
        <Banner
          v-if="chartVersionLoadsWithoutAuth"
          color="warning"
          :label="t('plugins.warnNoAuth')"
        />
        <Banner
          v-if="!plugin?.certified"
          color="warning"
          :label="t('plugins.install.warnNotCertified')"
        />
        <LabeledSelect
          v-if="showVersionSelector"
          v-model:value="version"
          label-key="plugins.install.version"
          :options="versionOptions"
          class="version-selector mt-10"
          data-testid="install-ext-modal-select-version"
        />
        <div v-else>
          {{ t('plugins.install.version') }} {{ version }}
        </div>
      </div>
      <div class="dialog-buttons">
        <button
          :disabled="busy"
          class="btn role-secondary"
          data-testid="install-ext-modal-cancel-btn"
          @click="closeDialog(false)"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          :mode="buttonMode"
          :icon="buttonIcon"
          data-testid="install-ext-modal-install-btn"
          @click="install"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .plugin-install-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      p {
        margin-bottom: 5px;
      }

      .dialog-info {
        flex: 1;
      }

      .toggle-advanced {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin: 10px 0;

        &:hover {
          text-decoration: none;
          color: var(--link);
        }
      }

      .version-selector {
        margin: 0 10px 10px 10px;
        width: auto;
      }
    }

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
</style>
