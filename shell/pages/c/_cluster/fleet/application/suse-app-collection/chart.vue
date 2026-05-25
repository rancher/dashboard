<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import ChartDetailBody from '@shell/components/ChartDetailBody.vue';
import { RcButton } from '@components/RcButton';
import isEqual from 'lodash/isEqual';
import day from 'dayjs';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { FLEET, ZERO_TIME } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
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

const repo = computed(() => {
  return store.getters['catalog/repo']({
    repoType: query.value.repoType,
    repoName: query.value.repoName,
  });
});

const mappedVersions = computed(() => {
  const versions = (chart.value?.versions || []).slice();

  versions.sort((a: any, b: any) => compareChartVersions(b.version, a.version));

  const OSs = currentCluster.value?.workerOSs;
  const out: any[] = [];

  versions.forEach((v: any) => {
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

  if (query.value.versionName) {
    items.push({
      icon:        'icon-version-alt',
      iconTooltip: { key: 'tableHeaders.version' },
      label:       query.value.versionName,
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
    await store.dispatch('catalog/load', { force: true });

    if (repo.value && query.value.chartName) {
      chart.value = store.getters['catalog/chart']({
        repoType:      query.value.repoType,
        repoName:      query.value.repoName,
        chartName:     query.value.chartName,
        includeHidden: true,
      });
    }

    if (!chart.value) {
      return;
    }

    let versionName = versionOverride || query.value.versionName;

    if (!versionName && chart.value.versions?.length) {
      const firstRelease = chart.value.versions.find((v: any) => !isPrerelease(v.version));

      versionName = firstRelease?.version || chart.value.versions[0].version;
    }

    if (!versionName) {
      return;
    }

    activeVersionName.value = versionName;

    try {
      version.value = store.getters['catalog/version']({
        repoType:  query.value.repoType,
        repoName:  query.value.repoName,
        chartName: query.value.chartName,
        versionName,
      });
    } catch (e) {
      console.error('Unable to fetch version:', e); // eslint-disable-line no-console
    }

    try {
      versionInfo.value = await store.dispatch('catalog/getVersionInfo', {
        repoType:  query.value.repoType,
        repoName:  query.value.repoName,
        chartName: query.value.chartName,
        versionName,
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
    <div
      v-if="chart"
      class="chart-header"
    >
      <div class="logo-container">
        <div class="logo-box">
          <LazyImage
            :src="chart.icon"
            class="logo"
            :alt="chart.chartNameDisplay"
          />
        </div>
      </div>
      <div class="header-body">
        <div class="header-top">
          <h1 class="title">
            <router-link :to="{ name: 'c-cluster-fleet-application-appco-charts', params: { cluster: $route.params.cluster }, query: { secret: secretName } }">
              {{ t('fleet.appCo.credentials.title') }}:
            </router-link>
            {{ chart.chartNameDisplay }}
          </h1>
        </div>
        <AppChartCardSubHeader :items="headerSubItems" />
        <p
          v-if="version && version.description"
          class="description"
        >
          {{ version.description }}
        </p>
      </div>
      <RcButton
        data-testid="appco-chart-install-btn"
        @click.prevent="install"
      >
        <i class="icon icon-plus mmr-2" />
        {{ t('catalog.chart.chartButton.action.install') }}
      </RcButton>
    </div>

    <div class="dashed-spacer" />

    <ChartDetailBody
      :version="version"
      :version-info="versionInfo"
      :version-info-error="versionInfoError"
      :versions="mappedVersions"
      :repo="repo"
      :chart="chart"
      :app-version="appVersion || ''"
      :home="home || ''"
      :maintainers="maintainers"
      @select-version="onSelectVersion"
    />
  </div>
</template>

<style lang="scss" scoped>
$logo-box-width: 60px;

.appco-chart-detail {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: var(--gap-lg);

  .logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .logo-box {
      width: $logo-box-width;
      height: $logo-box-width;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fff;
      border-radius: var(--border-radius);

      .logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }
    }
  }

  .header-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--gap);

    .title {
      margin: 0;
    }

    .description {
      line-height: 21px;
    }
  }

  .btn {
    margin-left: auto;
    height: 40px;
  }
}
</style>
