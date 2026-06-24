<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';

import { useI18n } from '@shell/composables/useI18n';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import ChartDetailHeader from './ChartDetailHeader.vue';
import ChartDetailBody from './ChartDetailBody.vue';

import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { FLEET, ZERO_TIME, CATALOG as CATALOG_TYPES } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addParams } from '@shell/utils/url';
import { compareChartVersions } from '@shell/utils/chart';
import { isPrerelease } from '@shell/utils/version';
import { LINUX } from '@shell/store/catalog';

import isEqual from 'lodash/isEqual';
import difference from 'lodash/difference';
import day from 'dayjs';

interface CatalogVersion {
  version: string;
  created?: string;
  icon?: string;
  description?: string;
  appVersion?: string;
  home?: string;
  maintainers?: Array<{ name?: string; url?: string; email?: string }>;
  sources?: string[];
  urls?: string[];
  keywords?: string[];
  annotations?: Record<string, string>;
}

interface ChartData {
  chartNameDisplay: string;
  icon: string;
  versions: CatalogVersion[];
  repoNameDisplay: string;
}

interface MappedVersion {
  label: string;
  version: string;
  originalVersion: string;
  id: string;
  created: string | null;
  disabled: boolean;
  keywords: string[];
}

interface VersionInfo {
  appReadme?: string;
  readme?: string;
  chart?: {
    appVersion?: string;
    home?: string;
    maintainers?: Array<{ name?: string; url?: string; email?: string }>;
  };
}

interface RepoObj {
  nameDisplay?: string;
  detailLocation: RouteLocationRaw;
  links: { info: string };
  followLink: (rel: string, opts: { url: string }) => Promise<VersionInfo>;
}

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);

const loading = ref(true);
const chart = ref<ChartData | null>(null);
const version = ref<CatalogVersion | null>(null);
const versionInfo = ref<VersionInfo | null>(null);
const versionInfoError = ref('');
const chartLoadError = ref(false);
const activeVersionName = ref('');

const currentCluster = computed(() => store.getters.currentCluster);

const query = computed(() => ({
  repoType:    (route.query[REPO_TYPE] as string) || '',
  repoName:    (route.query[REPO] as string) || '',
  chartName:   (route.query[CHART] as string) || '',
  versionName: (route.query[VERSION] as string) || '',
}));

const secretName = computed(() => (route.query.secret as string) || '');

const repoObj = ref<RepoObj | null>(null);

const mappedVersions = computed((): MappedVersion[] => {
  const versions = (chart.value?.versions || []).slice();

  versions.sort((a, b) => compareChartVersions(b.version, a.version));

  const OSs = currentCluster.value?.workerOSs;
  const out: MappedVersion[] = [];
  const seen = new Set<string>();

  versions.forEach((v) => {
    if (seen.has(v.version)) {
      return;
    }
    seen.add(v.version);

    if (isPrerelease(v.version)) {
      return;
    }

    const nue: MappedVersion = {
      label:           v.version,
      version:         v.version,
      originalVersion: v.version,
      id:              v.version,
      created:         v.created || null,
      disabled:        false,
      keywords:        v.keywords || [],
    };

    const permittedSystems = (v?.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).split(',');

    if (difference(OSs, permittedSystems).length > 0) {
      nue.disabled = true;
    }

    if (permittedSystems.length === 1) {
      nue.label = t(`catalog.install.versions.${ permittedSystems[0] }`, { ver: v.version });
    }

    out.push(nue);
  });

  const selectedMatch = out.find((v) => v.id === query.value.versionName);

  if (!selectedMatch && query.value.versionName) {
    out.unshift({
      label:           query.value.versionName,
      version:         query.value.versionName,
      originalVersion: query.value.versionName,
      id:              query.value.versionName,
      created:         null,
      disabled:        false,
      keywords:        [],
    });
  }

  return out;
});

const headerSubItems = computed(() => {
  if (!version.value) {
    return [];
  }

  const items: { icon: string; iconTooltip: { key: string }; label: string }[] = [];

  const versionLabel = activeVersionName.value || query.value.versionName;

  if (versionLabel) {
    items.push({
      icon:        'icon-version-alt',
      iconTooltip: { key: 'tableHeaders.version' },
      label:       versionLabel,
    });
  }

  if (version.value.created && version.value.created !== ZERO_TIME) {
    items.push({
      icon:        'icon-refresh-alt',
      iconTooltip: { key: 'tableHeaders.lastUpdated' },
      label:       day(version.value.created).format('MMM D, YYYY'),
    });
  }

  return items;
});

const appVersion = computed(() => version.value?.appVersion || versionInfo.value?.chart?.appVersion);
const home = computed(() => version.value?.home || versionInfo.value?.chart?.home);

const maintainers = computed(() => {
  const list = version.value?.maintainers || versionInfo.value?.chart?.maintainers || [];

  return list.map((m, i) => {
    const label = m.name || m.url || m.email || t('generic.unknown');
    let href: string | null = null;

    if (m.url) {
      href = m.url;
    } else if (m.email) {
      href = `mailto:${ m.email }`;
    }

    return {
      id: `${ m.name }-${ i }`, label, href, name: m.name
    };
  });
});

const fetchChartData = async(versionOverride?: string) => {
  loading.value = true;
  versionInfoError.value = '';
  chartLoadError.value = false;

  try {
    await store.dispatch('catalog/loadRepo', { repoName: query.value.repoName });

    const inStore = store.getters.currentCluster ? store.getters['currentProduct'].inStore : 'management';

    repoObj.value = store.getters[`${ inStore }/byId`](CATALOG_TYPES.CLUSTER_REPO, query.value.repoName);

    const catalogChart = store.getters['catalog/chart']({
      repoType:      query.value.repoType,
      repoName:      query.value.repoName,
      chartName:     query.value.chartName,
      includeHidden: true,
    });

    const chartVersions = catalogChart?.versions as CatalogVersion[] | undefined;

    if (!chartVersions?.length) {
      chartLoadError.value = true;

      return;
    }

    chart.value = {
      chartNameDisplay: catalogChart.chartNameDisplay || query.value.chartName,
      icon:             catalogChart.icon || chartVersions[0]?.icon || '',
      versions:         chartVersions,
      repoNameDisplay:  repoObj.value?.nameDisplay || query.value.repoName,
    };

    let versionName = versionOverride || query.value.versionName;

    if (!versionName) {
      const firstRelease = chartVersions.find((v) => !isPrerelease(v.version));

      versionName = firstRelease?.version || chartVersions[0].version;
    }

    const matchedVersion = chartVersions.find((v) => v.version === versionName);

    version.value = matchedVersion || chartVersions[0];
    activeVersionName.value = version.value.version;

    if (repoObj.value) {
      try {
        versionInfo.value = await repoObj.value.followLink('info', {
          url: addParams(repoObj.value.links.info, {
            chartName: query.value.chartName,
            version:   activeVersionName.value,
          }),
        });
      } catch (e: unknown) {
        versionInfoError.value = e instanceof Error ? e.message : String(e);
      }
    }
  } finally {
    loading.value = false;
  }
};

const install = () => {
  router.push({
    name:   'c-cluster-fleet-application-resource-create',
    params: {
      cluster:  route.params.cluster as string,
      resource: FLEET.HELM_OP,
    },
    query: {
      type:    FLEET.SUSE_APP_COLLECTION,
      chart:   query.value.chartName,
      version: activeVersionName.value,
      secret:  secretName.value,
    },
  });
};

const onSelectVersion = (vers: MappedVersion) => {
  router.push({
    name:   route.name as string,
    params: route.params,
    query:  {
      ...route.query,
      [VERSION]: vers.id,
    },
  });
};

watch(() => route.query, (neu, old) => {
  if (!isEqual(neu, old) && Object.keys(neu).length > 0) {
    const newVersion = neu[VERSION] as string;

    fetchChartData(newVersion);
  }
});

onMounted(() => fetchChartData());
</script>

<template>
  <Loading v-if="loading" />
  <div
    v-else
    class="appco-chart-detail"
  >
    <Banner
      v-if="chartLoadError"
      color="error"
      :label="t('fleet.appCo.chart.loadError')"
    />

    <ChartDetailHeader
      v-if="chart"
      :icon="chart.icon"
      :chart-name="chart.chartNameDisplay"
      :sub-header-items="headerSubItems"
      :description="version && version.description ? version.description : ''"
    >
      <template #back-link>
        <router-link :to="{ name: 'c-cluster-fleet-application-appco-charts', params: { cluster: route.params.cluster }, query: { secret: secretName } }">
          {{ t('fleet.appCo.chart.title') }}
        </router-link>
      </template>
      <template #action>
        <RcButton
          data-testid="appco-chart-install-btn"
          size="large"
          @click.prevent="install"
        >
          <i class="icon icon-plus mmr-2" />
          {{ t('catalog.chart.chartButton.action.install') }}
        </RcButton>
      </template>
    </ChartDetailHeader>

    <div class="dashed-spacer" />

    <ChartDetailBody
      :version="version"
      :version-info="versionInfo"
      :version-info-error="versionInfoError"
      :versions="mappedVersions"
      :repo="repoObj"
      :chart="chart"
      :app-version="appVersion || ''"
      :home="home || ''"
      :maintainers="maintainers"
      @select-version="onSelectVersion"
    />
  </div>
</template>

<style lang="scss" scoped>
.appco-chart-detail {
  display: flex;
  flex-direction: column;
}
</style>
