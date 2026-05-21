<script setup lang="ts">
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { DOCS_BASE } from '@shell/config/private-label';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { useWorkloadDashboard } from './workload-dashboard/composable';
import ByStateSection from './workload-dashboard/ByStateSection.vue';
import ByTypeSection from './workload-dashboard/ByTypeSection.vue';

const store = useStore();
const { t } = useI18n(store);

const {
  loading,
  fetchError,
  hasWorkloads,
  namespaceSubtitle,
  byStateLayout,
  byTypeCards,
  resetNamespaceFilter,
  resourceRoute,
} = useWorkloadDashboard();
</script>

<template>
  <Loading v-if="loading" />

  <div
    v-else
    class="workload-dashboard"
  >
    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ Empty state ━━━ -->
    <div
      v-if="!hasWorkloads"
      class="empty-state"
    >
      <h1 class="m-0">
        {{ t('workloadDashboard.empty.title') }}
      </h1>
      <div class="empty-state-tips">
        <RichTranslation k="workloadDashboard.empty.message">
          <template #resetLink="{ content }">
            <a
              role="button"
              class="link"
              @click="resetNamespaceFilter"
              @keyup.enter="resetNamespaceFilter"
            >{{ content }}</a>
          </template>
        </RichTranslation>
        <RichTranslation
          k="workloadDashboard.empty.docsMessage"
          tag="div"
        >
          <template #docsLink="{ content }">
            <SubtleLink
              :href="`${DOCS_BASE}/how-to-guides/new-user-guides/kubernetes-resources-setup/workloads-and-pods`"
              target="_blank"
              :open-in-new-tab="true"
            >
              {{ content }}
            </SubtleLink>
          </template>
        </RichTranslation>
      </div>
    </div>

    <template v-else>
      <header class="row">
        <div class="col span-12 title">
          <h1 class="m-0">
            {{ t('workloadDashboard.title') }}
          </h1>
          <div class="sub-title text-muted">
            {{ namespaceSubtitle }}
          </div>
        </div>
      </header>

      <!-- ━━━ By State ━━━ -->
      <div class="section">
        <h4 class="m-0 text-muted">
          {{ t('workloadDashboard.sections.byState') }}
        </h4>
        <ByStateSection
          :layout="byStateLayout"
          :resource-route="resourceRoute"
        />
      </div>

      <!-- ━━━ By Type ━━━ -->
      <div class="section">
        <h4 class="m-0 text-muted">
          {{ t('workloadDashboard.sections.byType') }}
        </h4>
        <ByTypeSection
          :cards="byTypeCards"
          :resource-route="resourceRoute"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.workload-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .section {
    h4 {
      line-height: 21px;
    }
    gap: 16px;
    display: flex;
    flex-direction: column;
  }

  .title {
    gap: 4px;

    h1 {
      line-height: 32px;
    }

    .sub-title {
      line-height: 21px;
    }
  }

  .empty-state {
    text-align: center;
    padding: 72px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    h1 {
      line-height: 38px;
    }
    .empty-state-tips {
      font-size: 16px;
      line-height: 29px;
    }
  }

  :deep(.state-card) {
    .body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  }
}
</style>
