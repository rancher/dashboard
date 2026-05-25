<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { FLEET_APPCO_AUTH_GENERATE_NAME, SECRET, CATALOG as CATALOG_TYPES } from '@shell/config/types';
import { CATALOG } from '@shell/config/labels-annotations';
import AppCoPageHeader from '@shell/components/fleet/AppCoPageHeader.vue';
import AppCoChartGrid from '@shell/components/fleet/AppCoChartGrid.vue';
import AppCoEmptyState from '@shell/components/fleet/AppCoEmptyState.vue';
import Loading from '@shell/components/Loading';
import { useI18n } from '@shell/composables/useI18n';
import { fetchAppCoCharts, deriveRepoName } from '@shell/utils/fleet-appco';
import type { RepoState } from '@shell/utils/fleet-appco';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);
const chartEntries = ref<Record<string, any[]>>({});
const chartsLoading = ref(true);
const chartsFetchError = ref(false);
const repoState = ref<RepoState | null>(null);
const secretName = ref((route.query.secret as string) || '');

const namespace = computed(() => store.getters.workspace);
const repoName = computed(() => deriveRepoName(secretName.value));

const secretUsername = computed(() => {
  if (!secretName.value) {
    return '';
  }

  const ns = namespace.value;
  const allSecrets = store.getters[`${ CATALOG._MANAGEMENT }/all`](SECRET) || [];
  const match = allSecrets.find((s: any) => s.metadata?.namespace === ns && s.metadata?.name === secretName.value);

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

const isRepoTransitioning = computed(() => repoState.value?.transitioning && !chartsFetchError.value && !Object.keys(chartEntries.value).length);
const isRepoError = computed(() => repoState.value?.error && !chartsFetchError.value);

const editCredentials = () => {
  router.push({
    name:   'c-cluster-fleet-application-appco-credentials',
    params: { cluster: route.params.cluster as string },
  });
};

const loadCharts = async() => {
  chartsLoading.value = true;
  chartsFetchError.value = false;
  repoState.value = null;

  try {
    const result = await fetchAppCoCharts(store, repoName.value, (state) => {
      repoState.value = state;
    });

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

    store.dispatch('catalog/loadRepo', { repoName: repoName.value });
  } catch (e) {
    console.error('Failed to fetch AppCo chart list:', e); // eslint-disable-line no-console
    chartsFetchError.value = true;
  } finally {
    chartsLoading.value = false;
  }
};

const selectChart = (chartValue: any) => {
  if (!chartValue) {
    return;
  }

  router.push({
    name:   'c-cluster-fleet-application-appco-chart',
    params: { cluster: route.params.cluster as string },
    query:  {
      'repo-type': 'cluster',
      repo:        repoName.value,
      chart:       chartValue.name,
      secret:      secretName.value,
    },
  });
};

onMounted(async() => {
  if (!secretName.value) {
    const ns = namespace.value;
    const allSecrets = store.getters[`${ CATALOG._MANAGEMENT }/all`](SECRET) || [];
    const match = allSecrets.find((s: any) => s.metadata?.namespace === ns && s.metadata?.name?.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME));

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
      :show-secret-info="true"
      :secret-label="secretUsername"
      @edit-credentials="editCredentials"
    />

    <Loading
      v-if="chartsLoading"
    />

    <AppCoEmptyState
      v-else-if="isRepoTransitioning"
      :title="t('fleet.helmOp.add.steps.selection.repoLoading.title')"
      :badge-state="repoBadgeState"
      data-testid="appco-charts-repo-loading"
    >
      {{ t('fleet.helmOp.add.steps.selection.repoLoading.description') }}
    </AppCoEmptyState>

    <AppCoEmptyState
      v-else-if="isRepoError"
      :title="t('fleet.helmOp.add.steps.selection.repoLoading.title')"
      :badge-state="repoBadgeState"
      data-testid="appco-charts-repo-error"
    >
      {{ t('fleet.helmOp.add.steps.selection.repoError.description') }}
      <router-link :to="repoListRoute">
        {{ t('fleet.helmOp.add.steps.selection.repoError.link') }}
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
