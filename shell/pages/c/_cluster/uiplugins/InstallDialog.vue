<script>
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import Banner from '@components/Banner/Banner.vue';

// Note: This dialog handles installation and update of a plugin

export default {
  components: {
    AsyncButton,
    Banner,
    LabeledSelect,
  },

  data() {
    return {
      plugin:   undefined,
      busy:     false,
      version:  '',
      update:   false,
      mode:      '',
    };
  },

  computed: {
    showVersionSelector() {
      return this.plugin?.versions.length > 1;
    },

    versionOptions() {
      if (!this.plugin) {
        return [];
      }

      return this.plugin.versions.map((version) => {
        return {
          label: version.version,
          value: version.version,
        };
      });
    },

    buttonMode() {
      return this.update ? 'update' : 'install';
    }
  },

  methods: {
    showDialog(plugin, mode) {
      this.plugin = plugin;
      this.mode = mode;

      // Default to latest version on install (this is default on the plugin)
      this.version = plugin.displayVersion;

      if (mode === 'update') {
        // Update to latest version, so take the first version
        if (plugin.versions.length > 0) {
          this.version = plugin.versions[0].version;
        }
      } else if (mode === 'rollback') {
        // Find the newest version once we remove the current version
        const versionNames = plugin.versions.filter(v => v.version !== plugin.displayVersion);

        if (versionNames.length > 0) {
          this.version = versionNames[0].version;
        }
      }

      // Make sure we have the version available
      const versionChart = plugin.versions?.find(v => v.version === this.version);

      if (!versionChart) {
        this.version = plugin.versions[0].version;
      }

      this.busy = false;
      this.update = mode !== 'install';
      this.$modal.show('installPluginDialog');
    },

    closeDialog(result) {
      this.$modal.hide('installPluginDialog');
      this.$emit('closed', result);
    },

    async install() {
      this.busy = true;

      const plugin = this.plugin;

      this.$emit(plugin.name, 'install');

      // Find the version that the user wants to install
      const version = plugin.versions?.find(v => v.version === this.version);

      if (!version) {
        this.busy = false;

        return;
      }

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

      const input = {
        charts:    [chart],
        // timeout:   this.cmdOptions.timeout > 0 ? `${ this.cmdOptions.timeout }s` : null,
        // wait:      this.cmdOptions.wait === true,
        namespace: UI_PLUGIN_NAMESPACE,
      };

      // Helm action
      const action = this.update ? 'upgrade' : 'install';

      // const name = plugin.chart.chartName;

      // const res = await this.repo.doAction((isUpgrade ? 'upgrade' : 'install'), input);
      const res = await repo.doAction(action, input);
      const operationId = `${ res.operationNamespace }/${ res.operationName }`;

      // Vue.set(this.installing, this.selected.chart.chartName, operationId);

      this.closeDialog(plugin);

      await repo.waitForOperation(operationId);

      await this.$store.dispatch(`management/find`, {
        type: CATALOG.OPERATION,
        id:   operationId
      });
    }
  }
};
</script>

<template>
  <modal
    name="installPluginDialog"
    height="auto"
    :scrollable="true"
  >
    <div v-if="plugin" class="plugin-install-dialog">
      <h4 class="mt-10">
        {{ t(`plugins.${ mode }.title`, { name: plugin.name }) }}
      </h4>
      <div class="custom mt-10">
        <div class="dialog-panel">
          <p>
            {{ t(`plugins.${ mode }.prompt`) }}
          </p>
          <Banner v-if="!plugin.certified" color="warning" :label="t('plugins.install.warnNotCertified')" />
          <LabeledSelect
            v-if="showVersionSelector"
            v-model="version"
            label-key="plugins.install.version"
            :options="versionOptions"
            class="version-selector mt-10"
          />
          <div v-else>
            {{ t('plugins.install.version') }} {{ version }}
          </div>
        </div>
        <div class="dialog-buttons">
          <button :disabled="busy" class="btn role-secondary" @click="closeDialog(false)">
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            :mode="buttonMode"
            @click="install"
          />
        </div>
      </div>
    </div>
  </modal>
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
