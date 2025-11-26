<script>
import AsyncButton from '@shell/components/AsyncButton';
import Checkbox from '@rc/Form/Checkbox/Checkbox.vue';
import { CATALOG } from '@shell/config/types';
import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';
import { isRancherPrime } from '@shell/config/version';

export default {
  emits: ['close'],

  components: { AsyncButton, Checkbox },

  props: {
    /**
     * Callback to update install status on extensions main screen
     */
    done: {
      type:    Function,
      default: () => {}
    },
  },

  async fetch() {
    if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
      this.repos = await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true } });
    }

    this.addRepos.official = isRancherPrime() && !this.hasRancherUIPluginsRepo;
    this.addRepos.partners = !this.hasRancherUIPartnersPluginsRepo;
  },

  data() {
    return {
      errors:   [],
      repos:    [],
      prime:    isRancherPrime(),
      addRepos: {
        official: false,
        partners: false
      },
      reposInfo: {
        official: {
          repo:   undefined,
          name:   UI_PLUGINS_REPOS.OFFICIAL.NAME,
          url:    UI_PLUGINS_REPOS.OFFICIAL.URL,
          branch: UI_PLUGINS_REPOS.OFFICIAL.BRANCH,
        },
        partners: {
          repo:   undefined,
          name:   UI_PLUGINS_REPOS.PARTNERS.NAME,
          url:    UI_PLUGINS_REPOS.PARTNERS.URL,
          branch: UI_PLUGINS_REPOS.PARTNERS.BRANCH,
        }
      },
      isDialogActive:      false,
      returnFocusSelector: '[data-testid="extensions-page-menu"]'
    };
  },

  computed: {
    hasRancherUIPluginsRepo() {
      return !!this.repos.find((r) => r.urlDisplay === UI_PLUGINS_REPOS.OFFICIAL.URL);
    },
    hasRancherUIPartnersPluginsRepo() {
      return !!this.repos.find((r) => r.urlDisplay === UI_PLUGINS_REPOS.PARTNERS.URL);
    }
  },

  methods: {
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

      this.done();
      this.$emit('close');

      btnCb(true);
    },
  }
};
</script>

<template>
  <div class="modal-dialog">
    <h4>
      {{ t('plugins.addRepos.title') }}
    </h4>
    <p class="mb-20">
      {{ t('plugins.addRepos.prompt', {}, true) }}
    </p>
    <!-- Official repo -->
    <div
      v-if="prime"
      class="mb-15"
    >
      <Checkbox
        v-model:value="addRepos.official"
        :disabled="$fetchState.pending || hasRancherUIPluginsRepo"
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
        v-model:value="addRepos.partners"
        :disabled="$fetchState.pending || hasRancherUIPartnersPluginsRepo"
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
    <div class="dialog-buttons mt-20">
      <button
        class="btn role-secondary"
        @click="$emit('close')"
      >
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton
        mode="add"
        class="ml-10"
        @click="doAddRepos"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .modal-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
    }

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
