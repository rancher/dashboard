<script setup lang="ts">
import {
  computed, ref, shallowRef, onMounted, onBeforeUnmount
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { SECRET, CATALOG as CATALOG_TYPES } from '@shell/config/types';
import { FLEET_APPCO_AUTH_GENERATE_NAME, fetchAppCoCharts, deriveRepoName } from '@shell/utils/fleet-appco';
import { CATALOG } from '@shell/config/labels-annotations';
import { REPO_TYPE, REPO, CHART } from '@shell/config/query-params';
import AppCoPageHeader from '@shell/components/fleet/AppCoPageHeader.vue';
import AppCoChartGrid from '@shell/components/fleet/AppCoChartGrid.vue';
import AppCoEmptyState from '@shell/components/fleet/AppCoEmptyState.vue';
import Loading from '@shell/components/Loading';
import { useI18n } from '@shell/composables/useI18n';
import type { RepoState } from '@shell/utils/fleet-appco';
import { RcIcon } from '@components/RcIcon';

interface ChartVersion {
  version: string;
  description?: string;
  icon?: string;
  appVersion?: string;
  created?: string;
}

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);
const chartEntries = ref<Record<string, ChartVersion[]>>({});
const chartsLoading = ref(true);
const chartsFetchError = ref(false);
const repoState = ref<RepoState | null>(null);
const secretName = ref((route.query.secret as string) || '');
const abortController = shallowRef<AbortController | null>(null);

onBeforeUnmount(() => {
  abortController.value?.abort();
});

const namespace = computed(() => store.getters.workspace);
const repoName = computed(() => deriveRepoName(secretName.value));

const getSecrets = () => store.getters[`${ CATALOG._MANAGEMENT }/all`](SECRET) || [];

const secretUsername = computed(() => {
  if (!secretName.value) {
    return '';
  }

  const ns = namespace.value;
  const match = getSecrets().find((s: any) => s.metadata?.namespace === ns && s.metadata?.name === secretName.value);

  return match?.decodedData?.username || '';
});

const repoListRoute = computed(() => ({
  name:   'c-cluster-product-resource-id',
  params: {
    cluster:  'local',
    product:  'apps',
    resource: CATALOG_TYPES.CLUSTER_REPO,
    id:       repoName.value,
  },
}));

const repoBadgeState = computed(() => repoState.value || undefined);

const isRepoTransitioning = computed(() => repoState.value?.transitioning && !chartsFetchError.value);
const isRepoError = computed(() => repoState.value?.error && !chartsFetchError.value);

const editCredentials = () => {
  router.push({
    name:   'c-cluster-fleet-application-appco-credentials',
    params: { cluster: route.params.cluster as string },
    query:  { secret: secretName.value },
  });
};

const loadCharts = async() => {
  abortController.value?.abort();
  abortController.value = new AbortController();
  chartsLoading.value = true;
  chartsFetchError.value = false;
  repoState.value = null;

  try {
    const result = await fetchAppCoCharts(store, repoName.value, (state) => {
      repoState.value = state;
    }, abortController.value.signal);

    repoState.value = result.repoState;

    if (!result.entries) {
      if (result.repoState?.error || result.repoState?.transitioning) {
        chartsFetchError.value = false;
      } else {
        chartsFetchError.value = true;
      }

      return;
    }

    chartEntries.value = result.entries;

    await store.dispatch('catalog/loadRepo', { repoName: repoName.value });
  } catch (e) {
    console.error('Failed to fetch AppCo chart list:', e); // eslint-disable-line no-console
    chartsFetchError.value = true;
  } finally {
    chartsLoading.value = false;
  }
};

const selectChart = (chartValue: { name: string }) => {
  if (!chartValue) {
    return;
  }

  router.push({
    name:   'c-cluster-fleet-application-appco-chart',
    params: { cluster: route.params.cluster as string },
    query:  {
      [REPO_TYPE]: 'cluster',
      [REPO]:      repoName.value,
      [CHART]:     chartValue.name,
      secret:      secretName.value,
    },
  });
};

onMounted(async() => {
  if (!secretName.value) {
    const ns = namespace.value;
    const match = getSecrets().find((s: any) => s.metadata?.namespace === ns && s.metadata?.name?.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME));

    if (match) {
      secretName.value = match.metadata.name;
    } else {
      router.replace({
        name:   'c-cluster-fleet-application-appco-credentials',
        params: { cluster: route.params.cluster as string },
      });

      return;
    }
  }

  await loadCharts();
});
</script>

<template>
  <div class="appco-charts-page">
    <AppCoPageHeader
      :subtitle="false"
      :show-secret-info="true"
      :secret-label="secretUsername"
      @edit-credentials="editCredentials"
    />

    <AppCoEmptyState
      v-if="isRepoTransitioning"
      :title="t('fleet.helmOp.add.steps.selection.repoLoading.title')"
      :badge-state="repoBadgeState"
      data-testid="appco-charts-repo-loading"
    >
      {{ t('fleet.helmOp.add.steps.selection.repoLoading.description') }}
    </AppCoEmptyState>

    <Loading
      v-else-if="chartsLoading"
    />

    <AppCoEmptyState
      v-else-if="isRepoError"
      :title="t('fleet.helmOp.add.steps.selection.repoLoading.title')"
      :badge-state="repoBadgeState"
      data-testid="appco-charts-repo-error"
    >
      {{ t('fleet.helmOp.add.steps.selection.repoError.description') }}
      <router-link :to="repoListRoute">
        {{ t('fleet.helmOp.add.steps.selection.repoError.link') }}
        <RcIcon
          type="external-link"
          size="small"
        />
      </router-link>
    </AppCoEmptyState>

    <AppCoEmptyState
      v-else-if="chartsFetchError"
      :title="t('fleet.helmOp.add.steps.selection.emptyState.connectionError.title')"
      data-testid="appco-charts-fetch-error"
    >
      {{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.descriptionPre') }}<br>
      {{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.please') }}
      <a
        href="#"
        @click.prevent="loadCharts"
      >{{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.tryAgain') }}</a>
      {{ t('fleet.helmOp.add.steps.selection.emptyState.connectionError.descriptionPost') }}
    </AppCoEmptyState>

    <AppCoChartGrid
      v-else
      :charts="chartEntries"
      :search-placeholder="t('fleet.helmOp.add.steps.selection.searchPlaceholder')"
      @select-chart="selectChart"
    />
  </div>
</template>

<style lang="scss" scoped>
.appco-charts-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
</style>
