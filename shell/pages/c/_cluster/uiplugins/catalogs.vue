
<script>
import CatalogList from './CatalogList/index.vue';

export default {
  name:       'ExtensionsAirgappedView',
  components: { CatalogList },
  data() {
    return {
      extensionsPageLink: {
        name:   'c-cluster-uiplugins',
        params: { cluster: this.$route.params.cluster }
      },
      reloadRequired: false
    };
  },
  methods: {
    returnToExtensionsPage() {
      this.$router.push(this.extensionsPageLink);
    },
    reload() {
      this.$router.go();
    },
    showCatalogLoadDialog() {
      this.$store.dispatch('management/promptModal', {
        component:           'ExtensionCatalogInstallDialog',
        returnFocusSelector: '[data-testid="extensions-catalog-load-dialog"]',
        componentProps:      {
          refresh: () => {
            this.reloadRequired = true;
          }
        }
      });
    },
    showCatalogUninstallDialog(ev) {
      this.$store.dispatch('management/promptModal', {
        component:           'ExtensionCatalogUninstallDialog',
        returnFocusSelector: '[data-testid="extensions-catalog-load-dialog"]',
        componentProps:      {
          catalog: ev,
          refresh: () => {
            this.reloadRequired = true;
          }
        }
      });
    },
  }
};
</script>

<template>
  <div id="extensions-airgapped-main-page">
    <div class="plugin-header">
      <!-- catalog/airgapped header -->
      <div class="catalog-title">
        <h2
          class="mb-0 mr-10"
          data-testid="extensions-catalog-title"
        >
          <a
            class="link"
            role="link"
            tabindex="0"
            :aria-label="t('plugins.manageCatalog.title')"
            @click="returnToExtensionsPage()"
          >
            {{ t('plugins.manageCatalog.title') }}:
          </a>
          <t k="plugins.manageCatalog.subtitle" />
        </h2>
      </div>
      <div class="actions-container">
        <!-- extensions reload toast/notification -->
        <div
          v-if="reloadRequired"
          class="plugin-reload-banner mmr-6"
          data-testid="extension-reload-banner"
        >
          <i class="icon icon-checkmark mr-10" />
          <span>
            {{ t('plugins.reload') }}
          </span>
          <button
            class="ml-10 btn btn-sm role-primary"
            data-testid="extension-reload-banner-reload-btn"
            role="button"
            :aria-label="t('plugins.labels.reloadRancher')"
            @click="reload()"
          >
            {{ t('generic.reload') }}
          </button>
        </div>
      </div>
    </div>
    <div>
      <!-- Catalog list view -->
      <CatalogList
        @showCatalogLoadDialog="showCatalogLoadDialog"
        @showCatalogUninstallDialog="showCatalogUninstallDialog($event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .plugin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .catalog-title {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    > h2 {
      flex: 1;
      margin-bottom: 0;
    }

    .link {
      cursor: pointer;
    }
  }

  .plugin-reload-banner {
    align-items: center;
    background-color: var(--success-banner-bg);
    display: flex;
    padding: 4px 4px 4px 12px;
    border-radius: 5px;
    min-height: 36px;

    > i {
      color: var(--success);
      font-size: 14px;
      font-weight: bold;
    }

    > button {
      line-height: 30px;
      min-height: 30px;
    }
  }
</style>
