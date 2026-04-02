<script>
import { mapGetters } from 'vuex';
import { isPrerelease } from '@shell/utils/version';
import { set } from '@shell/utils/object';
import { RcItemCard } from '@components/RcItemCard';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading';
import { AUTH_TYPE, FLEET, FLEET_APPCO_AUTH_GENERATE_NAME } from '@shell/config/types';
import { CATALOG, FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';

export default {
  name: 'HelmOpAppCoSelectionTab',

  components: {
    RcItemCard,
    AppChartCardSubHeader,
    SelectOrCreateAuthSecret,
    AsyncButton,
    Banner,
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
  },

  emits: [
    'update:cached-auth',
    'update:auth',
    'select-chart',
    'select-chart-next',
  ],

  data() {
    return {
      searchQuery: '',
      FLEET_APPCO_AUTH_GENERATE_NAME,
    };
  },

  computed: {
    ...mapGetters(['workspace']),

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

      const q = this.searchQuery.toLowerCase();

      return this.allCharts.filter((chart) => {
        return chart.name.toLowerCase().includes(q) ||
          chart.description.toLowerCase().includes(q);
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

    workspaceObj() {
      const allWorkspaces = this.$store.getters[`${ CATALOG._MANAGEMENT }/all`](FLEET.WORKSPACE) || [];
      const ns = this.value.metadata?.namespace;

      return allWorkspaces.find((ws) => ws.id === ns);
    },

    currentDefault() {
      return this.workspaceObj?.metadata?.annotations?.[FLEET_ANNOTATIONS.APPCO_DEFAULT_AUTH] || '';
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

    isAlreadyDefault() {
      return !!(this.selectedSecretName && this.selectedSecretName === this.currentDefault);
    },

    hasCharts() {
      return Object.keys(this.appCoChartEntries).length > 0;
    },

    showAuthPrompt() {
      return !this.isExistingSecretSelected && !this.hasCharts && !this.appCoChartsLoading;
    },
  },

  methods: {
    formatDate(dateString) {
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

    async saveSecret(buttonCb) {
      try {
        const creds = this.tempCachedValues?.helmSecretName;

        await this.onCreateAuth(creds);
        buttonCb(true);
      } catch (e) {
        buttonCb(false);
      }
    },

    async saveAsDefault(buttonCb) {
      try {
        const ws = this.workspaceObj;

        if (!ws) {
          buttonCb(false);

          return;
        }

        if (!ws.metadata.annotations) {
          ws.metadata.annotations = {};
        }

        ws.metadata.annotations[FLEET_ANNOTATIONS.APPCO_DEFAULT_AUTH] = this.selectedSecretName;

        await ws.save();
        buttonCb(true);
      } catch (e) {
        buttonCb(false);
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
  },
};
</script>

<template>
  <div class="appco-selection-tab">
    <div class="auth-section">
      <SelectOrCreateAuthSecret
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
        @update:value="updateAuth($event, 'helmSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
      />

      <div
        v-if="!isExistingSecretSelected"
        class="mt-10"
      >
        <Banner
          v-for="(err, i) in createErrors"
          :key="i"
          color="error"
          :label="err"
        />
        <AsyncButton
          :disabled="!hasCredentials"
          mode="createAppCoAuth"
          @click="saveSecret"
        />
      </div>

      <div
        v-if="isExistingSecretSelected"
        class="mt-10"
      >
        <span
          v-clean-tooltip="isAlreadyDefault ? t('fleet.helmOp.auth.alreadyDefault') : null"
          class="set-default-wrapper"
        >
          <AsyncButton
            :class="{ 'no-pointer': isAlreadyDefault }"
            mode="setAppCoDefault"
            :disabled="isAlreadyDefault"
            @click="saveAsDefault"
          />
        </span>
      </div>
    </div>

    <div class="search-section">
      <div class="search-input">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('fleet.helmOp.add.steps.selection.searchPlaceholder')"
          data-testid="appco-selection-chart-search"
        >
        <i class="icon icon-search" />
      </div>
    </div>

    <Loading
      v-if="appCoChartsLoading"
      mode="relative"
    />

    <template v-else-if="hasCharts">
      <div class="total-and-sort">
        <p
          class="total-message"
          data-testid="appco-selection-charts-total"
        >
          {{ totalMessage }}
        </p>
      </div>

      <div
        class="chart-cards"
        data-testid="appco-selection-chart-cards"
      >
        <rc-item-card
          v-for="card in chartCards"
          :id="card.id"
          :key="card.id"
          :header="card.header"
          :image="card.image"
          :content="card.content"
          :value="card.rawChart"
          variant="medium"
          :clickable="true"
          :selected="value.spec.helm.chart === card.id"
          data-testid="appco-selection-chart-card"
          @card-click="selectChart"
          @dblclick="selectChartAndNext(card.rawChart)"
        >
          <template #item-card-sub-header>
            <AppChartCardSubHeader :items="card.subHeaderItems" />
          </template>
        </rc-item-card>
      </div>
    </template>

    <div
      v-else-if="showAuthPrompt"
      class="charts-empty"
    >
      <p data-testid="appco-selection-auth-prompt">
        {{ t('fleet.helmOp.add.steps.selection.authPrompt') }}
      </p>
    </div>

    <div
      v-else-if="!appCoChartsLoading && isExistingSecretSelected && !hasCharts"
      class="charts-empty"
    >
      <p data-testid="appco-selection-no-charts">
        {{ t('fleet.helmOp.add.steps.selection.noCharts') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.appco-selection-tab {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-section {
  margin-bottom: 5px;

  :deep(.select-or-create-auth-secret > .mt-20) {
    margin-top: 0 !important;
  }
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

.total-and-sort {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;

  .total-message {
    font-size: 16px;
    font-weight: 600;
    color: var(--body-text);
  }
}

.chart-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  grid-gap: var(--gap-md);
  width: 100%;
  height: max-content;
  overflow: hidden;
}

.charts-empty {
  text-align: center;
  padding: 72px 0;
  color: var(--input-label);
}

.set-default-wrapper {
  display: inline-block;

  .no-pointer {
    cursor: not-allowed;
  }
}
</style>
