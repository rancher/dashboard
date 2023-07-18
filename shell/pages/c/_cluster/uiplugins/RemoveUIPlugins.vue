<script>
import { mapGetters } from 'vuex';
import { CATALOG, UI_PLUGIN } from '@shell/config/types';
import Dialog from '@shell/components/Dialog.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import {
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHARTS,
  UI_PLUGIN_OPERATOR_CRD_CHART_NAME,
  UI_PLUGINS_REPO_NAME,
  UI_PLUGINS_REPO_URL,
  UI_PLUGINS_REPO_BRANCH,
  UI_PLUGINS_PARTNERS_REPO_NAME,
  UI_PLUGINS_PARTNERS_REPO_URL,
  UI_PLUGINS_PARTNERS_REPO_BRANCH,
} from '@shell/config/uiplugins';

export default {
  components: {
    Checkbox,
    Dialog,
  },

  async fetch() {
    if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
      // we need to force the request, so that we know at all times if what's the status of the offical and partners repos (installed or not)
      await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true } });
    }

    if (this.$store.getters['management/schemaFor'](UI_PLUGIN)) {
      const plugins = await this.$store.dispatch('management/findAll', { type: UI_PLUGIN });

      // Are there any plugins installed?
      this.hasPluginsInstalled = (plugins || []).length > 0;
      this.removeCRD = !this.hasPluginsInstalled;
    }
  },

  data() {
    return {
      errors:      [],
      removeRepos: {
        official: true,
        partners: true
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
      removeCRD:           true,
      hasPluginsInstalled: false,
    };
  },

  computed: {
    ...mapGetters({ repos: 'catalog/repos' }),
    officialRepo() {
      const repo = this.repos.find((r) => r.urlDisplay === UI_PLUGINS_REPO_URL);

      return repo?.id ? repo : undefined;
    },
    partnersRepo() {
      const repo = this.repos.find((r) => r.urlDisplay === UI_PLUGINS_PARTNERS_REPO_URL);

      return repo?.id ? repo : undefined;
    }
  },

  methods: {
    async removeChart(name) {
      const apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });
      const found = apps.find((app) => {
        return app.namespace === UI_PLUGIN_NAMESPACE && app.name === name;
      });

      if (found) {
        return found.remove();
      }

      // Return rejected promise - could not find the required chart
      return Promise.reject(new Error(`Could not find chart §{ name }`));
    },

    showDialog() {
      this.removeRepos = {
        official: !!this.officialRepo,
        partners: !!this.partnersRepo,
      };
      this.$modal.show('confirm-uiplugins-remove');
    },

    async doRemove(btnCb) {
      this.errors = [];

      // Remove the charts in the reverse order that we install them in
      let uninstall = [...UI_PLUGIN_CHARTS].reverse();

      if (!this.removeCRD) {
        // User does not want to uninstall the CRD, so remove the chart
        uninstall = uninstall.filter((chart) => chart !== UI_PLUGIN_OPERATOR_CRD_CHART_NAME);
      }

      for (let i = 0; i < uninstall.length; i++) {
        const chart = uninstall[i];

        try {
          await this.removeChart(chart);
        } catch (e) {
          this.errors.push(e.message);
        }
      }

      // remove extension repos that have been picked
      const promises = [];

      for (const key in this.removeRepos) {
        if (this.removeRepos[key] && this[`${ key }Repo`]) {
          promises.push(this[`${ key }Repo`].remove());
        }
      }

      const res = await Promise.allSettled(promises);

      res.forEach((result) => {
        if (result.status === 'rejected') {
          console.error(result.reason); // eslint-disable-line no-console

          this.errors.push(result.reason);
        }
      });

      // forget PLUGINS type from store as it's not needed
      this.$store.dispatch('management/forgetType', UI_PLUGIN);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.$emit('done');

      btnCb(true);
    },
  }
};
</script>
<template>
  <Dialog
    name="confirm-uiplugins-remove"
    :title="t('plugins.setup.remove.title')"
    mode="disable"
    data-testid="disable-ext-modal"
    @okay="doRemove"
  >
    <template>
      <p class="mb-20">
        {{ t('plugins.setup.remove.prompt') }}
      </p>
      <!-- Official repo -->
      <div
        class="mb-15"
      >
        <Checkbox
          v-model="removeRepos.official"
          :primary="true"
          :disabled="!officialRepo"
          label-key="plugins.setup.remove.registry.official.title"
          data-testid="disable-ext-modal-remove-official-repo"
        />
        <div
          v-if="!officialRepo"
          class="checkbox-info"
        >
          ({{ t('plugins.setup.uninstalled') }})
        </div>
      </div>
      <!-- Partners repo -->
      <div
        class="mb-15"
      >
        <Checkbox
          v-model="removeRepos.partners"
          :primary="true"
          :disabled="!partnersRepo"
          label-key="plugins.setup.remove.registry.partners.title"
          data-testid="disable-ext-modal-remove-partners-repo"
        />
        <div
          v-if="!partnersRepo"
          class="checkbox-info"
        >
          ({{ t('plugins.setup.uninstalled') }})
        </div>
      </div>
      <div
        v-if="hasPluginsInstalled"
        class="mt-20"
      >
        <Checkbox
          v-model="removeCRD"
          :primary="true"
          label-key="plugins.setup.remove.crd.title"
        />
        <div class="checkbox-info">
          {{ t('plugins.setup.remove.crd.prompt') }}
        </div>
      </div>
    </template>
  </Dialog>
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
