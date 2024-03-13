<script>
import { mapGetters } from 'vuex';
import AsyncButton, { ASYNC_BUTTON_STATES } from '@shell/components/AsyncButton';
import IconMessage from '@shell/components/IconMessage.vue';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import Dialog from '@shell/components/Dialog.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import Banner from '@components/Banner/Banner.vue';
import { isRancherPrime } from '@shell/config/version';

import {
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHARTS,
  UI_PLUGIN_OPERATOR_REPO_NAME,
  UI_PLUGINS_REPO_NAME,
  UI_PLUGINS_REPO_URL,
  UI_PLUGINS_REPO_BRANCH,
  UI_PLUGINS_PARTNERS_REPO_NAME,
  UI_PLUGINS_PARTNERS_REPO_URL,
  UI_PLUGINS_PARTNERS_REPO_BRANCH,
} from '@shell/config/uiplugins';

export default {
  components: {
    AsyncButton,
    Checkbox,
    Banner,
    IconMessage,
    Dialog,
  },

  async fetch() {
    // Check to see that the charts we need are available
    const c = this.$store.getters['catalog/rawCharts'];
    const charts = Object.values(c);
    const found = [];

    UI_PLUGIN_CHARTS.forEach((c) => {
      const f = charts.find((chart) => chart.repoName === UI_PLUGIN_OPERATOR_REPO_NAME & chart.chartName === c);

      if (f) {
        found.push(f);
      }
    });

    this.haveCharts = (found.length === UI_PLUGIN_CHARTS.length);

    if (this.haveCharts) {
      this.installCharts = found;

      if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
        // we need to force the request, so that we know at all times if what's the status of the offical and partners repos (installed or not)
        await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true } });
      }
    }

    this.defaultRegistrySetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'system-default-registry'
    });

    this.loading = false;
  },

  data() {
    return {
      loading:       true,
      haveCharts:    false,
      installCharts: [],
      errors:        [],
      prime:         isRancherPrime(),
      addRepos:      {
        official: true,
        partners: true,
      },
      reposInfo: {
        official: {
          name:   UI_PLUGINS_REPO_NAME,
          url:    UI_PLUGINS_REPO_URL,
          branch: UI_PLUGINS_REPO_BRANCH,
        },
        partners: {
          name:   UI_PLUGINS_PARTNERS_REPO_NAME,
          url:    UI_PLUGINS_PARTNERS_REPO_URL,
          branch: UI_PLUGINS_PARTNERS_REPO_BRANCH,
        }
      },
      buttonState:            ASYNC_BUTTON_STATES.ACTION,
      defaultRegistrySetting: null,
    };
  },

  computed: {
    ...mapGetters({ repos: 'catalog/repos' }),
    hasRancherUIPluginsRepo() {
      return !!this.repos.find((r) => r.urlDisplay === UI_PLUGINS_REPO_URL);
    },
    hasRancherUIPartnersPluginsRepo() {
      return !!this.repos.find((r) => r.urlDisplay === UI_PLUGINS_PARTNERS_REPO_URL);
    },
    isAnyRepoAvailableForInstall() {
      return (isRancherPrime() && !this.hasRancherUIPluginsRepo) || !this.hasRancherUIPartnersPluginsRepo;
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

      // Pass in the system default registry property if set
      const defaultRegistry = this.defaultRegistrySetting?.value || '';

      if (defaultRegistry) {
        chart.values.global = chart.values.global || {};
        chart.values.global.cattle = chart.values.global.cattle || {};
        chart.values.global.cattle.systemDefaultRegistry = defaultRegistry;
      }

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

    async enable() {
      this.errors = [];

      // force update of cluster repos so that modal have the correct information about the official and partners repo
      this.$emit('refreshCharts');

      // Reset checkbox based on if the repo is already installed
      this.addRepos = {
        official: isRancherPrime() && !this.hasRancherUIPluginsRepo,
        partners: !this.hasRancherUIPartnersPluginsRepo,
      };

      this.$modal.show('confirm-uiplugins-setup');
    },

    async dialogClosed(ok) {
      this.errors = [];

      // User wants to proceed
      if (ok) {
        this.buttonState = ASYNC_BUTTON_STATES.WAITING;

        if (Object.values(this.addRepos).find((v) => v)) {
          await this.addDefaultHelmRepositories();
        }

        await this.installPluginCharts();

        await new Promise((resolve) => setTimeout(resolve, 5000));

        this.buttonState = this.errors.length > 0 ? ASYNC_BUTTON_STATES.ERROR : ASYNC_BUTTON_STATES.ACTION;

        this.$emit('done');
      }
    },

    async addDefaultHelmRepositories() {
      const promises = [];

      for (const key in this.addRepos) {
        if (this.addRepos[key]) {
          const pluginCR = await this.$store.dispatch('management/create', {
            type:     CATALOG.CLUSTER_REPO,
            metadata: { name: this.reposInfo[key].name },
            spec:     {
              gitBranch: this.reposInfo[key].branch,
              gitRepo:   this.reposInfo[key].url,
            }
          });

          promises.push(pluginCR.save());
        }
      }

      const res = await Promise.allSettled(promises);

      res.forEach((result) => {
        if (result.status === 'rejected') {
          console.error(result.reason); // eslint-disable-line no-console

          this.errors.push(result.reason);
        }
      });
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

      return new Promise((resolve) => setTimeout(resolve, 2000));
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
              data-testid="extension-enable-operator"
              @click="enable"
            />
          </div>
          <div
            v-for="(e, i) in errors"
            :key="i"
            class="plugin-setup-error"
          >
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
        <p class="mb-20">
          {{ t('plugins.setup.install.prompt') }}
        </p>
        <Banner
          v-if="isAnyRepoAvailableForInstall"
          color="info"
          class="mb-20"
        >
          {{ t('plugins.setup.install.airgap') }}
        </Banner>
        <!-- Official rancher repo -->
        <div
          v-if="prime"
          class="mb-15"
        >
          <Checkbox
            v-model="addRepos.official"
            :disabled="hasRancherUIPluginsRepo"
            :primary="true"
            label-key="plugins.setup.install.addRancherRepo"
            data-testid="extension-enable-operator-official-repo"
          />
          <div
            v-if="hasRancherUIPluginsRepo"
            class="checkbox-info"
          >
            ({{ t('plugins.setup.installed') }})
          </div>
        </div>
        <!-- Partners rancher repo -->
        <div
          class="mb-15"
        >
          <Checkbox
            v-model="addRepos.partners"
            :disabled="hasRancherUIPartnersPluginsRepo"
            :primary="true"
            label-key="plugins.setup.install.addPartnersRancherRepo"
            data-testid="extension-enable-operator-partners-repo"
          />
          <div
            v-if="hasRancherUIPartnersPluginsRepo"
            class="checkbox-info"
          >
            ({{ t('plugins.setup.installed') }})
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
