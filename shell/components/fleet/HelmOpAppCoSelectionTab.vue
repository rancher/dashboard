<script>
import { isPrerelease } from '@shell/utils/version';
import { set } from '@shell/utils/object';
import { RcItemCard } from '@components/RcItemCard';
import { RcButton } from '@components/RcButton';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import AppCoEmptyState from '@shell/components/fleet/AppCoEmptyState.vue';
import Banner from '@components/Banner/Banner.vue';
import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';
import {
  AUTH_TYPE, CATALOG, FLEET_APPCO_AUTH_GENERATE_NAME, SECRET, ZERO_TIME
} from '@shell/config/types';

export default {
  name: 'HelmOpAppCoSelectionTab',

  components: {
    RcItemCard,
    RcButton,
    AppChartCardSubHeader,
    SelectOrCreateAuthSecret,
    AppCoEmptyState,
    Banner,
    LazyImage,
    Loading,
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
    isView: {
      type:    Boolean,
      default: false
    },
    tempCachedValues: {
      type:     Object,
      required: true
    },
    createErrors: {
      type:    Array,
      default: () => []
    },
    onCreateAuth: {
      type:     Function,
      required: true
    },
    registerBeforeHook: {
      type:     Function,
      required: true
    },
    appCoChartEntries: {
      type:    Object,
      default: () => ({})
    },
    appCoChartsLoading: {
      type:    Boolean,
      default: false
    },
    appCoChartsFetchError: {
      type:    Boolean,
      default: false
    },
    appCoRepoState: {
      type:    Object,
      default: null
    },
  },

  emits: [
    'update:cached-auth',
    'update:auth',
    'select-chart',
    'select-chart-next',
    'retry-fetch',
  ],

  data() {
    return {
      searchQuery:      '',
      secretsReady:     false,
      initialChartName: this.value.spec?.helm?.chart || '',
      FLEET_APPCO_AUTH_GENERATE_NAME,
    };
  },

  computed: {
    allCharts() {
      const entries = this.appCoChartEntries;

      if (!entries || !Object.keys(entries).length) {
        return [];
      }

      return Object.keys(entries).sort().map((name) => {
        const versions = entries[name] || [];
        const latest = versions[0] || {};

        return {
          name,
          description: latest.description || '',
          icon:        latest.icon || '',
          version:     latest.version || '',
          appVersion:  latest.appVersion || '',
          created:     latest.created || '',
          versions,
        };
      });
    },

    filteredCharts() {
      if (!this.searchQuery) {
        return this.allCharts;
      }

      const raw = this.searchQuery;
      const exactMatch = /^"(.+)"$/.exec(raw);
      const q = exactMatch ? exactMatch[1].toLowerCase() : raw.toLowerCase();

      return this.allCharts.filter((chart) => {
        const name = chart.name.toLowerCase();
        const desc = chart.description.toLowerCase();

        if (exactMatch) {
          return name === q || desc === q;
        }

        return name.includes(q) || desc.includes(q);
      });
    },

    chartCards() {
      return this.filteredCharts.map((chart) => {
        const dateStr = chart.created ? this.formatDate(chart.created) : '';
        const subHeaderItems = [];

        if (chart.version) {
          subHeaderItems.push({
            icon:        'icon-version-alt',
            iconTooltip: { key: 'tableHeaders.version' },
            label:       chart.version,
          });
        }

        if (dateStr) {
          subHeaderItems.push({
            icon:        'icon-refresh-alt',
            iconTooltip: { key: 'tableHeaders.lastUpdated' },
            label:       dateStr,
          });
        }

        return {
          id:       chart.name,
          header:   { title: { text: chart.name } },
          image:    chart.icon ? { src: chart.icon, alt: { text: chart.name } } : undefined,
          content:  { text: chart.description },
          subHeaderItems,
          rawChart: chart,
        };
      });
    },

    totalMessage() {
      const count = this.filteredCharts.length;

      if (this.searchQuery) {
        return this.t('fleet.helmOp.add.steps.selection.totalMatched', { count });
      }

      return this.t('fleet.helmOp.add.steps.selection.totalCharts', { count });
    },

    preSelectValue() {
      if (this.tempCachedValues.helmSecretName) {
        return this.tempCachedValues.helmSecretName;
      }

      const defaultAuth = this.currentDefault;

      if (defaultAuth) {
        return { selected: `${ this.value.metadata?.namespace }/${ defaultAuth }` };
      }

      return { selected: AUTH_TYPE._BASIC };
    },

    currentDefault() {
      const ns = this.value.metadata?.namespace;
      const allSecrets = this.$store.getters['management/all'](SECRET) || [];
      const match = allSecrets.find((s) => s.metadata?.namespace === ns && s.metadata?.name?.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME));

      return match?.metadata?.name || '';
    },

    selectedSecretName() {
      const raw = this.value.spec?.helmSecretName || '';

      return raw?.includes?.('/') ? raw?.split?.('/')[1] : raw;
    },

    isExistingSecretSelected() {
      return !!this.selectedSecretName && !Object.values(AUTH_TYPE).includes(this.selectedSecretName);
    },

    hasCredentials() {
      const creds = this.tempCachedValues?.helmSecretName;

      return !!(creds?.publicKey && creds?.privateKey);
    },

    hasCharts() {
      return Object.keys(this.appCoChartEntries).length > 0;
    },

    initialSelectedChart() {
      if (!this.initialChartName) {
        return null;
      }

      const currentChartName = this.value.spec?.helm?.chart;
      const chartName = currentChartName || this.initialChartName;

      return this.allCharts.find((c) => c.name === chartName) || null;
    },

    showAuthPrompt() {
      return this.secretsReady && !this.isExistingSecretSelected && !this.hasCharts && !this.appCoChartsLoading;
    },

    repoListRoute() {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  'local',
          product:  'apps',
          resource: CATALOG.CLUSTER_REPO,
          id:       this.appCoRepoState?.repoName,
        },
      };
    },
  },

  watch: {
    appCoChartEntries() {
      if (!this.value.spec?.helm?.chart) {
        this.searchQuery = '';
      }
    },
  },

  mounted() {
    this.$refs.searchInput?.focus();

    // Watch the child component's fetch state to know when secrets are loaded
    const unwatch = this.$watch(
      () => this.$refs.authSecretRef?.$fetchState?.pending,
      (pending) => {
        if (pending === false) {
          this.secretsReady = true;
          unwatch();
        }
      },
      { immediate: true }
    );
  },

  methods: {
    formatDate(dateString) {
      if (!dateString || dateString === ZERO_TIME) {
        return '';
      }

      try {
        const d = new Date(dateString);

        return d.toLocaleDateString(undefined, {
          year:  'numeric',
          month: 'short',
          day:   'numeric'
        });
      } catch (e) {
        return dateString;
      }
    },

    updateCachedAuthVal(value, key) {
      this.$emit('update:cached-auth', { value, key });
    },

    updateAuth(value, key) {
      this.$emit('update:auth', { value, key });
    },

    async saveSecret() {
      try {
        const creds = this.tempCachedValues?.helmSecretName;

        await this.onCreateAuth(creds);
      } catch (e) {
        console.error('Failed to save secret:', e); // eslint-disable-line no-console
      }
    },

    selectChart(chartValue) {
      if (!chartValue) {
        return;
      }

      const versions = chartValue.versions || [];
      const versionOptions = versions
        .filter((entry) => !isPrerelease(entry.version))
        .map((entry) => entry.version)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
        .map((v) => ({ label: v, value: v }));

      // Set the chart + version on the HelmOp spec
      set(this.value, 'spec.helm.chart', chartValue.name);
      set(this.value, 'spec.helm.version', versionOptions[0]?.value || '');

      this.$emit('select-chart', {
        chartName: chartValue.name,
        version:   versionOptions[0]?.value || '',
        versionOptions,
      });
    },

    selectChartAndNext(chartValue) {
      this.selectChart(chartValue);
      this.$emit('select-chart-next');
    },

    clearSearch() {
      this.searchQuery = '';
      this.$refs.searchInput?.focus();
    },

    retryFetch() {
      this.$emit('retry-fetch');
    },

    onKeydown(e) {
      const input = this.$refs.searchInput;

      if (!input || e.target === input) {
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
  },
};
</script>

<template>
  <div
    class="appco-selection-tab"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <div class="gap-24">
      <div class="auth-section">
        <Banner
          v-for="(err, i) in createErrors"
          :key="i"
          color="error"
          :label="err"
        />
        <div class="create-secret-section">
          <div class="full-width">
            <SelectOrCreateAuthSecret
              ref="authSecretRef"
              :value="value.spec.helmSecretName"
              :namespace="value.metadata.namespace"
              :limit-to-namespace="true"
              :delegate-create-to-parent="true"
              :register-before-hook="registerBeforeHook"
              in-store="management"
              :mode="mode"
              :generate-name="FLEET_APPCO_AUTH_GENERATE_NAME"
              label-key="fleet.helmOp.auth.appco"
              :fixed-http-basic-auth="true"
              :filter-basic-auth="FLEET_APPCO_AUTH_GENERATE_NAME"
              :allow-none="false"
              :pre-select="preSelectValue"
              :cache-secrets="true"
              :no-margin-top="true"
              @update:value="updateAuth($event, 'helmSecretName')"
              @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
            />
          </div>
          <div
            v-if="secretsReady && !isExistingSecretSelected"
          >
            <RcButton
              :disabled="!hasCredentials"
              variant="secondary"
              size="small"
              @click="saveSecret"
            >
              {{ t('asyncButton.createAppCoAuth.action') }}
            </RcButton>
          </div>
        </div>

        <div
          v-if="secretsReady && !isExistingSecretSelected"
          class="mmt-4"
        >
          <Banner
            class="no-margin"
            color="info"
            :label="t('fleet.helmOp.add.steps.selection.authBanner')"
          />
        </div>
      </div>

      <div class="charts-section">
        <!-- Selected chart -->
        <div
          v-if="initialSelectedChart"
          class="selected-chart"
          data-testid="appco-selection-selected-chart"
        >
          <h3 class="selected-chart-label">
            {{ t('fleet.helmOp.add.steps.selection.selectedChart') }}
          </h3>
          <div class="selected-chart-info">
            <LazyImage
              v-if="initialSelectedChart.icon"
              :src="initialSelectedChart.icon"
              class="selected-chart-icon"
              :alt="initialSelectedChart.name"
            />
            <i
              v-else
              class="icon icon-helm selected-chart-icon-placeholder"
            />
            <span class="selected-chart-name">{{ initialSelectedChart.name }}</span>
          </div>
        </div>
        <div
          v-if="hasCharts"
          class="search-section"
        >
          <div class="search-input">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              :placeholder="t('fleet.helmOp.add.steps.selection.searchPlaceholder')"
              :aria-label="t('fleet.helmOp.add.steps.selection.searchPlaceholder')"
              data-testid="appco-selection-chart-search"
            >
            <i class="icon icon-search" />
          </div>
        </div>

        <Loading
          v-if="!secretsReady || appCoChartsLoading"
          mode="relative"
        />

        <AppCoEmptyState
          v-else-if="showAuthPrompt"
          :title="t('fleet.helmOp.add.steps.selection.emptyState.noAuth.title')"
          data-testid="appco-selection-auth-prompt"
        >
          {{ t('fleet.helmOp.add.steps.selection.emptyState.noAuth.description') }}
        </AppCoEmptyState>

        <AppCoEmptyState
          v-else-if="appCoRepoState?.transitioning"
          :title="t('fleet.helmOp.add.steps.selection.repoLoading.title')"
          :badge-state="appCoRepoState"
          data-testid="appco-selection-repo-loading"
        >
          {{ t('fleet.helmOp.add.steps.selection.repoLoading.description') }}
        </AppCoEmptyState>

        <AppCoEmptyState
          v-else-if="appCoRepoState?.error"
          :title="t('fleet.helmOp.add.steps.selection.repoLoading.title')"
          :badge-state="appCoRepoState"
          data-testid="appco-selection-repo-loading"
        >
          {{ t('fleet.helmOp.add.steps.selection.repoError.description') }}
          <router-link :to="repoListRoute">
            {{ t('fleet.helmOp.add.steps.selection.repoError.link') }}
          </router-link>
        </AppCoEmptyState>

        <AppCoEmptyState
          v-else-if="appCoChartsFetchError"
          :title="t('fleet.helmOp.add.steps.selection.emptyState.connectionError.title')"
          data-testid="appco-selection-fetch-error"
        >
          {{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.descriptionPre') }}<br>
          {{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.please') }}
          <a
            href="#"
            @click.prevent="retryFetch"
          >{{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.tryAgain') }}</a>
          {{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.descriptionPost') }}
        </AppCoEmptyState>

        <template v-else-if="hasCharts">
          <div
            v-if="filteredCharts.length"
            class="chart-cards"
            data-testid="appco-selection-chart-cards"
          >
            <rc-item-card
              v-for="card in chartCards"
              :id="card.id"
              :key="card.id"
              :class="['chart-card', { 'single-chart': filteredCharts.length === 1 }]"
              :header="card.header"
              :image="card.image"
              :content="card.content"
              :value="card.rawChart"
              variant="medium"
              :clickable="true"
              :selected="value.spec.helm.chart === card.id"
              data-testid="appco-selection-chart-card"
              @card-click="selectChart"
            >
              <template #item-card-sub-header>
                <AppChartCardSubHeader :items="card.subHeaderItems" />
              </template>
            </rc-item-card>
          </div>
          <AppCoEmptyState
            v-else
            :title="t('fleet.helmOp.add.steps.selection.emptyState.noMatch.title')"
            data-testid="appco-selection-no-charts"
          >
            {{ t('fleet.helmOp.add.steps.selection.emptyState.noMatch.descriptionPre') }}
            <a
              href="#"
              @click.prevent="clearSearch"
            >{{ t('fleet.helmOp.add.steps.selection.emptyState.noMatch.clearSearch') }}</a>
            {{ t('fleet.helmOp.add.steps.selection.emptyState.noMatch.descriptionPost') }}
          </AppCoEmptyState>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.appco-selection-tab {
  display: flex;
  flex-direction: column;
  outline: none;
}

.gap-24 {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-section {
  .search-input {
    position: relative;

    input {
      width: 100%;
      height: 48px;
      padding-left: 16px;
      padding-right: 40px;
    }

    .icon-search {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 16px;
    }
  }
}

.create-secret-section {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
}
.no-margin {
  margin: 0 !important;
}

.full-width {
  width: 100%;
}

.chart-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-gap: var(--gap-md);
  width: 100%;
  height: max-content;
  overflow: hidden;
}

.single-chart {
  max-width: 500px;
}

.selected-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .selected-chart-label {
    color: var(--input-label);
    margin: 0;
  }

  .selected-chart-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .selected-chart-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .selected-chart-icon-placeholder {
    font-size: 24px;
  }

  .selected-chart-name {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }
}
</style>
