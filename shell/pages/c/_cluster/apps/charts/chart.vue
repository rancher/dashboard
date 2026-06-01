<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { useChart } from '@shell/composables/useChart';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import ChartDetailHeader from '@shell/components/ChartDetailHeader.vue';
import ChartDetailBody from '@shell/components/ChartDetailBody.vue';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter';
import { RcButton } from '@components/RcButton';
import isEqual from 'lodash/isEqual';
import {
  CHART, REPO, REPO_TYPE, VERSION, SEARCH_QUERY, CATEGORY, TAG,
  DEPRECATED as DEPRECATED_QUERY
} from '@shell/config/query-params';
import { compatibleVersionsFor } from '@shell/store/catalog';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);

const loading = ref(true);

const {
  chart,
  version,
  versionInfo,
  versionInfoError,
  existing,
  query,
  repo,
  mappedVersions,
  currentVersion,
  targetVersion,
  action,
  isChartTargeted,
  warnings,
  requires,
  showPreRelease,
  currentCluster,
  appLocation,
  fetchChart: doFetchChart,
} = useChart(store, route, router, t);

const headerContent = computed(() => {
  if (!chart.value?.cardContent) {
    return {
      subHeaderItems: [], statuses: [], footerItems: []
    };
  }

  return {
    ...chart.value.cardContent,
    subHeaderItems: chart.value.cardContent.subHeaderItems.map((item: any, i: number) => (i === 0 ? ({
      icon:        'icon-version-alt',
      iconTooltip: { key: 'tableHeaders.version' },
      label:       query.value.versionName,
    }) : item)),
  };
});

const appVersion = computed(() => version.value?.appVersion || versionInfo.value?.chart?.appVersion);
const home = computed(() => version.value?.home || versionInfo.value?.chart?.home);

const maintainers = computed(() => {
  const list = version.value?.maintainers || versionInfo.value?.chart?.maintainers || [];

  return list.map((m: any, i: number) => {
    const label = m.name || m.url || m.email || t('generic.unknown');
    let href: string | null = null;

    if (m.url) {
      href = m.url;
    } else if (m.email) {
      href = `mailto:${ m.email }`;
    }

    return {
      id: `${ m.name }-${ i }`, name: m.name, label, href
    };
  });
});

const osWarning = computed(() => {
  if (chart.value) {
    const compatible = compatibleVersionsFor(chart.value, currentCluster.value.workerOSs, showPreRelease.value);
    const currentlyCompatible = !!compatible.find((v: any) => v.version === targetVersion.value);

    if (currentlyCompatible) {
      return false;
    } else if (compatible.length > 0) {
      return t('catalog.os.versionIncompatible');
    } else {
      return t('catalog.os.chartIncompatible');
    }
  }

  return false;
});

const warningMessage = computed(() => {
  if (!chart.value) {
    return '';
  }

  const {
    deprecated, experimental, chartName: name, chartNameDisplay
  } = chart.value;
  const chartName = chartNameDisplay || name;

  if (deprecated && experimental) {
    return t('catalog.chart.deprecatedAndExperimentalWarning', { chartName });
  } else if (deprecated) {
    return t('catalog.chart.deprecatedWarning', { chartName });
  } else if (experimental) {
    return t('catalog.chart.experimentalWarning', { chartName });
  }

  return '';
});

const targetedAppWarning = computed(() => {
  if (!existing.value) {
    return '';
  }

  const url = router.resolve(appLocation()).href;

  return isChartTargeted.value ? t('catalog.chart.errors.clusterToolExists', { url }, true) : '';
});

async function fetchChart() {
  loading.value = true;

  try {
    await doFetchChart();
  } finally {
    loading.value = false;
  }
}

function install() {
  router.push({
    name:   'c-cluster-apps-charts-install',
    params: {
      cluster: route.params.cluster as string,
      product: store.getters['productId'],
    },
    query: {
      [REPO_TYPE]:        query.value.repoType,
      [REPO]:             query.value.repoName,
      [CHART]:            query.value.chartName,
      [VERSION]:          query.value.versionName,
      [DEPRECATED_QUERY]: query.value.deprecated,
    },
  });
}

function handleHeaderItemClick(type: string, value: string) {
  let queryValue: string | undefined;

  if (type === REPO) {
    const repos = store.getters['catalog/repos'];

    queryValue = repos.find((r: any) => r.nameDisplay === value)?.metadata?.uid;
  } else if (type === CATEGORY || type === TAG) {
    queryValue = value.toLowerCase();
  }

  if (queryValue) {
    router.push({
      name:   'c-cluster-apps-charts',
      params: {
        cluster: route.params.cluster as string,
        product: store.getters['productId'],
      },
      query: { [type]: queryValue },
    });
  }
}

function getVersionRoute(vers: any) {
  return {
    name:   route.name as string,
    params: route.params,
    query:  { ...route.query, [VERSION]: vers.id },
  };
}

watch(() => route.query, (neu, old) => {
  if (!isEqual(neu, old) && Object.keys(neu).length > 0) {
    fetchChart();
  }
});

onMounted(() => fetchChart());
</script>

<template>
  <Loading v-if="loading" />
  <main v-else>
    <ChartDetailHeader
      v-if="chart"
      :icon="chart.icon"
      :icon-alt="t('catalog.charts.iconAlt', { app: chart.chartNameDisplay })"
      :chart-name="chart.chartNameDisplay"
      :sub-header-items="headerContent.subHeaderItems"
      :description="version && version.description ? version.description : ''"
    >
      <template #back-link>
        <router-link :to="{ name: 'c-cluster-apps-charts' }">
          {{ t('catalog.chart.header.charts') }}:
        </router-link>
      </template>
      <template #after-logo>
        <div
          v-if="chart.featured"
          v-clean-tooltip="t('generic.featured')"
          class="featured-pill"
        >
          {{ t('generic.shortFeatured') }}
        </div>
      </template>
      <template #statuses>
        <div
          v-if="headerContent.statuses.length"
          class="statuses"
        >
          <div
            v-for="(status, i) in headerContent.statuses"
            :key="i"
            class="status"
          >
            <i
              v-clean-tooltip="status.tooltip.key ? t(status.tooltip.key) : status.tooltip.text"
              :class="['icon', status.icon, status.color]"
              :style="{color: status.customColor}"
              role="img"
              :aria-label="status.tooltip.key ? t(status.tooltip.key) : status.tooltip.text"
            />
          </div>
        </div>
      </template>
      <template #after-description>
        <AppChartCardFooter
          :clickable="true"
          :items="headerContent.footerItems"
          @click:item="handleHeaderItemClick"
        />
      </template>
      <template #action>
        <RcButton
          v-if="!requires.length"
          data-testid="btn-chart-install"
          class="btn role-primary"
          @click.prevent="install"
        >
          <i
            :class="['icon', action.icon, 'mmr-2']"
          />
          {{ t(`catalog.chart.chartButton.action.${action.tKey}` ) }}
        </RcButton>
      </template>
    </ChartDetailHeader>

    <div class="dashed-spacer" />

    <ChartDetailBody
      :version="version"
      :version-info="versionInfo"
      :version-info-error="versionInfoError"
      :versions="mappedVersions"
      :repo="repo"
      :chart="chart"
      :current-version="currentVersion"
      :app-version="appVersion || ''"
      :home="home || ''"
      :maintainers="maintainers"
      @select-version="$router.push(getVersionRoute($event))"
    >
      <template #banners>
        <Banner
          v-if="warningMessage"
          color="warning"
          :label="warningMessage"
          data-testid="deprecation-and-experimental-banner"
        />
        <div
          v-if="requires.length || warnings.length || targetedAppWarning || osWarning"
          class="chart-banners"
        >
          <Banner
            v-if="osWarning"
            color="error"
          >
            <span v-clean-html="osWarning" />
          </Banner>
          <Banner
            v-for="(msg, i) in requires"
            :key="'req-' + i"
            color="error"
          >
            <span v-clean-html="msg" />
          </Banner>
          <Banner
            v-for="(msg, i) in warnings"
            :key="'warn-' + i"
            color="warning"
          >
            <span v-clean-html="msg" />
          </Banner>
          <Banner
            v-if="targetedAppWarning"
            color="warning"
          >
            <span v-clean-html="targetedAppWarning" />
          </Banner>
        </div>
      </template>

      <template #sidebar-extra>
        <div
          v-if="version && version.keywords"
          class="chart-body__info-section chart-body__info-section--keywords"
        >
          <h4>{{ t('catalog.chart.info.keywords') }}</h4>
          <div class="keyword-links">
            <span
              v-for="(keyword, i) in version.keywords"
              :key="i"
              class="keyword-item"
            >
              <router-link
                v-clean-tooltip="t('catalog.charts.findSimilar.message', { type: t('catalog.charts.findSimilar.types.keyword') }, true)"
                :to="{ name: 'c-cluster-apps-charts', query: { [SEARCH_QUERY]: keyword } }"
                data-testid="chart-keyword-link"
              >
                {{ keyword }}
              </router-link>
              <span v-if="version.keywords.length > 1 && i !== version.keywords.length - 1">,</span>
            </span>
          </div>
        </div>
      </template>
    </ChartDetailBody>
  </main>
</template>

<style lang="scss" scoped>
  $logo-box-width: 60px;

  :deep(.featured-pill) {
    display: flex;
    width: $logo-box-width;
    padding: 4px 8px;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    background: var(--default);
    text-transform: uppercase;
    color: var(--disabled-text);
    font-size: 10px;
    font-weight: 600;
  }

  :deep(.statuses) {
    display: flex;
    align-items: center;
    gap: 12px;

    .status {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        font-size: 23px;
        &.error    { color: var(--error); }
        &.info     { color: var(--info); }
        &.success  { color: var(--success); }
      }
    }
  }

  .chart-banners {
    .banner {
      margin-top: 0;
      margin-bottom: 24px;
    }
  }
</style>
