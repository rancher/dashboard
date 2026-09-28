<script setup lang="ts">
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { DOCS_BASE } from '@shell/config/private-label';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { useWorkloadDashboard } from './composable';
import ByStateSection from './ByStateSection.vue';
import ByTypeSection from './ByTypeSection.vue';
import ByNamespaceSection from './ByNamespaceSection.vue';

const store = useStore();
const { t } = useI18n(store);

const {
  loading,
  fetchError,
  hasWorkloads,
  namespaceSubtitle,
  byStateLayout,
  byTypeCards,
  byNamespaceCards,
  resetNamespaceFilter,
  filterByNamespace,
  resourceRoute,
  navigateToNamespace,
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
      data-testid="workload-dashboard-empty"
    >
      <h1 class="m-0">
        {{ t('workloadDashboard.empty.title') }}
      </h1>
      <div class="empty-state-tips">
        <RichTranslation k="workloadDashboard.empty.message">
          <template #resetLink="{ content }">
            <a
              role="button"
              tabindex="0"
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
              :open-in-new-tab-label="t('generic.opensInNewTab')"
            >
              {{ content }}
            </SubtleLink>
          </template>
        </RichTranslation>
      </div>
    </div>

    <template v-else>
      <Masthead
        resource="workload"
        :type-display="t('workloadDashboard.title')"
        :is-creatable="false"
        :show-favorite="false"
        component-testid="workload-dashboard"
      >
        <template #subHeader>
          <div
            class="text-muted mmt-1"
            data-testid="workload-dashboard-subtitle"
          >
            {{ namespaceSubtitle }}
          </div>
        </template>
      </Masthead>
      <div class="workload-content">
        <!-- ━━━ By State ━━━ -->
        <div
          class="section"
          data-testid="workload-dashboard-by-state"
        >
          <h4 class="m-0 text-deemphasized">
            {{ t('workloadDashboard.sections.byState') }}
          </h4>
          <ByStateSection
            :layout="byStateLayout"
            :resource-route="resourceRoute"
          />
        </div>

        <!-- ━━━ By Type ━━━ -->
        <div
          class="section"
          data-testid="workload-dashboard-by-type"
        >
          <h4 class="m-0 text-deemphasized">
            {{ t('workloadDashboard.sections.byType') }}
          </h4>
          <ByTypeSection
            :cards="byTypeCards"
            :resource-route="resourceRoute"
          />
        </div>

        <!-- ━━━ By Namespace ━━━ -->
        <div
          class="section"
          data-testid="workload-dashboard-by-namespace"
        >
          <h4 class="m-0 text-deemphasized">
            {{ t('workloadDashboard.sections.byNamespace') }}
          </h4>
          <ByNamespaceSection
            :cards="byNamespaceCards"
            :navigate-to-namespace="navigateToNamespace"
            :filter-by-namespace="filterByNamespace"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.workload-dashboard {
  display: flex;
  flex-direction: column;

  .workload-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section {
    h4 {
      line-height: 21px;
    }
    gap: 16px;
    display: flex;
    flex-direction: column;
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

}
</style>
