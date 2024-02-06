<script>
import { CATALOG } from '@shell/config/types';
import Dialog from '@shell/components/Dialog.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import {
  UI_PLUGINS_REPO_NAME,
  UI_PLUGINS_REPO_URL,
  UI_PLUGINS_REPO_BRANCH,
  UI_PLUGINS_PARTNERS_REPO_NAME,
  UI_PLUGINS_PARTNERS_REPO_URL,
  UI_PLUGINS_PARTNERS_REPO_BRANCH,
} from '@shell/config/uiplugins';
import { isRancherPrime } from '@shell/config/version';

export default {
  components: {
    Checkbox,
    Dialog,
  },

  async fetch() {
    if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
      this.repos = await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true } });
    }
  },

  data() {
    return {
      errors:   [],
      repos:    [],
      prime:    isRancherPrime(),
      addRepos: {
        official: true,
        partners: true
      },
      reposInfo: {
        official: {
          repo:   undefined,
          name:   UI_PLUGINS_REPO_NAME,
          url:    UI_PLUGINS_REPO_URL,
          branch: UI_PLUGINS_REPO_BRANCH,
        },
        partners: {
          repo:   undefined,
          name:   UI_PLUGINS_PARTNERS_REPO_NAME,
          url:    UI_PLUGINS_PARTNERS_REPO_URL,
          branch: UI_PLUGINS_PARTNERS_REPO_BRANCH,
        }
      }
    };
  },

  computed: {
    hasRancherUIPluginsRepo() {
      return !!this.repos.find((r) => r.urlDisplay === UI_PLUGINS_REPO_URL);
    },
    hasRancherUIPartnersPluginsRepo() {
      return !!this.repos.find((r) => r.urlDisplay === UI_PLUGINS_PARTNERS_REPO_URL);
    }
  },

  methods: {
    showDialog() {
      this.addRepos = {
        official: isRancherPrime() && !this.hasRancherUIPluginsRepo,
        partners: !this.hasRancherUIPartnersPluginsRepo,
      };
      this.$modal.show('add-extensions-repos');
    },

    async doAddRepos(btnCb) {
      this.errors = [];
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

      if (promises.length) {
        const res = await Promise.allSettled(promises);

        res.forEach((result) => {
          if (result.status === 'rejected') {
            console.error(result.reason); // eslint-disable-line no-console

            this.errors.push(result.reason);
          }
        });
      }

      this.$emit('done');

      btnCb(true);
    },
  }
};
</script>
<template>
  <Dialog
    name="add-extensions-repos"
    :title="t('plugins.addRepos.title')"
    mode="add"
    data-testid="add-extensions-repos-modal"
    @okay="doAddRepos"
  >
    <template>
      <p class="mb-20">
        {{ t('plugins.addRepos.prompt', {}, true) }}
      </p>
      <!-- Official repo -->
      <div
        v-if="prime"
        class="mb-15"
      >
        <Checkbox
          v-model="addRepos.official"
          :disabled="hasRancherUIPluginsRepo"
          :primary="true"
          label-key="plugins.setup.install.addRancherRepo"
          data-testid="add-extensions-repos-modal-add-official-repo"
        />
        <div
          v-if="hasRancherUIPluginsRepo"
          class="checkbox-info"
        >
          ({{ t('plugins.setup.installed') }})
        </div>
      </div>
      <!-- Partners repo -->
      <div
        class="mb-15"
      >
        <Checkbox
          v-model="addRepos.partners"
          :disabled="hasRancherUIPartnersPluginsRepo"
          :primary="true"
          label-key="plugins.setup.install.addPartnersRancherRepo"
          data-testid="add-extensions-repos-modal-add-partners-repo"
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
