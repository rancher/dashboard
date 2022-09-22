<script>
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

const PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

export default {
  components: {
    AsyncButton,
    LabeledSelect,
  },

  data() {
    return {
      plugin:   undefined,
      busy:     false,
      advanced: false,
      version:  '',
    };
  },

  computed: {
    showAdvanced() {
      return this.plugin?.versions.length > 0;
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
    }
  },

  methods: {
    showDialog(plugin) {
      this.plugin = plugin;
      this.version = plugin.displayVersion;
      this.busy = false;
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

      const version = plugin.versions[0];
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
        namespace: PLUGIN_NAMESPACE,
        // projectId: this.project,
      };

      const action = 'install';

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

      // console.log(operation); // eslint-disable-line no-console
      // this.$emit(plugin.name, false);
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
        Install UI Plugin: {{ plugin.name }}
      </h4>
      <div class="custom mt-10">
        <div class="dialog-panel">
          <p>Are you sure that you want to install this UI Plugin?</p>
          <p>Please ensure that you are aware of the risks of installing UI Plugins from untrusted authors.</p>
          <div v-if="showAdvanced">
            <a class="toggle-advanced" @click="advanced = !advanced">Advanced <i v-if="advanced" class="icon icon-chevron-up" /><i v-if="!advanced" class="icon icon-chevron-down" /></a>
            <div v-if="advanced">
              <LabeledSelect
                v-model="version"
                label="Install Version"
                :options="versionOptions"
                class="version-selector"
              />
            </div>
          </div>
        </div>
        <div class="dialog-buttons">
          <button :disabled="busy" class="btn role-secondary" @click="closeDialog(false)">
            Cancel
          </button>
          <AsyncButton
            mode="install"
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
