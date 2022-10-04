<script>
import AsyncButton from '@shell/components/AsyncButton';
import IconMessage from '@shell/components/IconMessage.vue';
import { CATALOG, UI_PLUGIN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import Dialog from '@shell/components/Dialog.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { ASYNC_BUTTON_STATES } from '@shell/components/AsyncButton.vue';
import {
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHARTS,
  UI_PLUGIN_OPERATOR_REPO_NAME,
  UI_PLUGINS_REPO_NAME,
  UI_PLUGINS_REPO_URL,
  UI_PLUGINS_REPO_BRANCH,
} from '@shell/config/uiplugins';

export default {
  components: {
    AsyncButton,
    Checkbox,
    IconMessage,
    Dialog,
  },

  async fetch() {
    // Check to see that the charts we need are available
    const c = this.$store.getters['catalog/rawCharts'];
    const charts = Object.values(c);
    const found = [];

    UI_PLUGIN_CHARTS.forEach((c) => {
      const f = charts.find(chart => chart.repoName === UI_PLUGIN_OPERATOR_REPO_NAME & chart.chartName === c);

      if (f) {
        found.push(f);
      }
    });

    this.haveCharts = (found.length === UI_PLUGIN_CHARTS.length);

    if (this.haveCharts) {
      this.installCharts = found;

      if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
        await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO });
      }
    }

    this.loading = false;
  },

  data() {
    return {
      loading:                 true,
      haveCharts:              false,
      installCharts:           [],
      errors:                  [],
      addRepo:                 true,
      buttonState:             ASYNC_BUTTON_STATES.ACTION,
    };
  },

  computed: {
    hasRancherUIPluginsRepo() {
      // Look to see if the Rancher UI Plugins repository is already installed
      const repos = this.$store.getters['catalog/repos'];

      return !!repos.find(r => r.name === UI_PLUGINS_REPO_NAME);
    }
  },

  methods: {
    async installChart(installChart) {
      const version = installChart.versions[0];
      const repoType = version.repoType;
      const repoName = version.repoName;
      const repo = this.$store.getters['catalog/repo']({ repoType, repoName });

      const chart = {
        chartName:   installChart.chartName,
        version:     version.version,
        releaseName: installChart.chartName,
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: repoName
        },
        values: {}
      };

      const input = {
        charts:    [chart],
        wait:      true,
        namespace: UI_PLUGIN_NAMESPACE,
      };

      const action = 'install';
      const res = await repo.doAction(action, input);
      const operationId = `${ res.operationNamespace }/${ res.operationName }`;

      await repo.waitForOperation(operationId);

      return this.$store.dispatch(`management/find`, {
        type: CATALOG.OPERATION,
        id:   operationId
      });
    },

    enable() {
      this.errors = [];

      // Reset checkbox bsed on if the repo is already installed
      this.addRepo = !this.hasRancherUIPluginsRepo;

      this.$modal.show('confirm-uiplugins-setup');
    },

    async dialogClosed(ok) {
      this.errors = [];

      // User wants to proceed
      if (ok) {
        this.buttonState = ASYNC_BUTTON_STATES.WAITING;

        if (this.addRepo) {
          await this.addDefaultHelmRepository();
        }

        await this.installPluginCharts();

        await new Promise(resolve => setTimeout(resolve, 5000));

        this.$store.dispatch('management/forgetType', UI_PLUGIN);

        this.buttonState = this.errors.length > 0 ? ASYNC_BUTTON_STATES.ERROR : ASYNC_BUTTON_STATES.ACTION;

        this.$router.push(
          {
            path:  this.$route.path,
            force: true,
          },
        );
      }
    },

    async addDefaultHelmRepository() {
      const name = UI_PLUGINS_REPO_NAME;

      try {
        const pluginCR = await this.$store.dispatch('management/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name },
          spec:     {
            gitBranch: UI_PLUGINS_REPO_BRANCH,
            gitRepo:   UI_PLUGINS_REPO_URL,
          }
        });

        return pluginCR.save();
      } catch (e) {
        console.error(e); // eslint-disable-line no-console

        this.errors.push(e.message);
      }
    },

    async installPluginCharts() {
      for (let i = 0; i < this.installCharts.length; i++) {
        const chart = this.installCharts[i];

        try {
          await this.installChart(chart);
        } catch (e) {
          this.errors.push(e.message);
        }
      }

      return new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
</script>
<template>
  <div>
    <IconMessage
      :vertical="true"
      :subtle="false"
      icon="icon-gear"
    >
      <template v-slot:message>
        <h2>
          {{ t('plugins.setup.title') }}
        </h2>
        <div v-if="!loading">
          <div v-if="!haveCharts">
            <p>
              {{ t('plugins.setup.prompt.cant') }}
            </p>
          </div>
          <div v-else>
            <p>
              {{ t('plugins.setup.prompt.can') }}
            </p>
            <AsyncButton
              mode="enable"
              :manual="true"
              :current-phase="buttonState"
              class="enable-plugin-support"
              @click="enable"
            />
          </div>
          <div v-for="(e, i) in errors" :key="i" class="plugin-setup-error">
            {{ e }}
          </div>
        </div>
      </template>
    </IconMessage>
    <Dialog
      name="confirm-uiplugins-setup"
      :title="t('plugins.setup.install.title')"
      @closed="dialogClosed"
    >
      <template>
        <p>
          {{ t('plugins.setup.install.prompt') }}
        </p>
        <div v-if="!hasRancherUIPluginsRepo" class="mt-20">
          <Checkbox v-model="addRepo" :primary="true" label-key="plugins.setup.install.addRancherRepo" />
          <div class="checkbox-info">
            {{ t('plugins.setup.install.airgap') }}
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>
<style lang="scss" scoped>
  .enable-plugin-support {
    font-size: 14px;
    margin-top: 20px;
  }

  .plugin-setup-error {
    font-size: 14px;
    color: var(--error);
    margin: 10px 0 0 0;
  }

  .checkbox-info {
    margin-left: 20px;
    opacity: 0.7;
  }
</style>
