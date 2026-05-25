<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import Loading from '@shell/components/Loading';
import ChartDetailHeader from '@shell/components/ChartDetailHeader.vue';
import ChartDetailBody from '@shell/components/ChartDetailBody.vue';
import { RcButton } from '@components/RcButton';
import isEqual from 'lodash/isEqual';
import day from 'dayjs';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { FLEET, ZERO_TIME, CATALOG as CATALOG_TYPES } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addParams } from '@shell/utils/url';
import { compareChartVersions } from '@shell/utils/chart';
import { isPrerelease } from '@shell/utils/version';
import { LINUX } from '@shell/store/catalog';
import difference from 'lodash/difference';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);

const loading = ref(true);
const chart = ref<any>(null);
const version = ref<any>(null);
const versionInfo = ref<any>(null);
const versionInfoError = ref('');
const activeVersionName = ref('');

const currentCluster = computed(() => store.getters.currentCluster);

const query = computed(() => ({
  repoType:    (route.query[REPO_TYPE] as string) || '',
  repoName:    (route.query[REPO] as string) || '',
  chartName:   (route.query[CHART] as string) || '',
  versionName: (route.query[VERSION] as string) || '',
}));

const secretName = computed(() => (route.query.secret as string) || '');

const repoObj = ref<any>(null);

const mappedVersions = computed(() => {
  const versions = (chart.value?.versions || []).slice();

  versions.sort((a: any, b: any) => compareChartVersions(b.version, a.version));

  const OSs = currentCluster.value?.workerOSs;
  const out: any[] = [];
  const seen = new Set<string>();

  versions.forEach((v: any) => {
    if (seen.has(v.version)) {
      return;
    }
    seen.add(v.version);
    const nue: any = {
      label:           v.version,
      version:         v.version,
      originalVersion: v.version,
      id:              v.version,
      created:         v.created,
      disabled:        false,
      keywords:        v.keywords,
    };

    const permittedSystems = (v?.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).split(',');

    if (permittedSystems.length > 0 && difference(OSs, permittedSystems).length > 0) {
      nue.disabled = true;
    }

    if (permittedSystems.length === 1) {
      nue.label = t(`catalog.install.versions.${ permittedSystems[0] }`, { ver: v.version });
    }

    if (isPrerelease(v.version)) {
      return;
    }

    out.push(nue);
  });

  const selectedMatch = out.find((v) => v.id === query.value.versionName);

  if (!selectedMatch && query.value.versionName) {
    out.unshift({
      label:           query.value.versionName,
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

  const items: any[] = [];

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

  return list.map((m: any, i: number) => {
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

    const chartVersions = catalogChart?.versions;

    if (!chartVersions?.length) {
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
      const firstRelease = chartVersions.find((v: any) => !isPrerelease(v.version));

      versionName = firstRelease?.version || chartVersions[0].version;
    }

    activeVersionName.value = versionName;
    version.value = chartVersions.find((v: any) => v.version === versionName) || chartVersions[0];

    try {
      versionInfo.value = await repoObj.value.followLink('info', {
        url: addParams(repoObj.value.links.info, {
          chartName: query.value.chartName,
          version:   versionName,
        }),
      });
    } catch (e: any) {
      versionInfoError.value = e?.message || String(e);
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

const onSelectVersion = (vers: any) => {
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
    <ChartDetailHeader
      v-if="chart"
      :icon="chart.icon"
      :chart-name="chart.chartNameDisplay"
      :sub-header-items="headerSubItems"
      :description="version && version.description ? version.description : ''"
    >
      <template #back-link>
        <router-link :to="{ name: 'c-cluster-fleet-application-appco-charts', params: { cluster: $route.params.cluster }, query: { secret: secretName } }">
          {{ t('fleet.appCo.chart.title') }}:
        </router-link>
      </template>
      <template #action>
        <RcButton
          data-testid="appco-chart-install-btn"
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
