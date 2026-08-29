<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { stateColorCssVar } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';
import OverviewCard from './OverviewCard.vue';
import { CERT_MANAGER_DOCS } from './composable';
import type { OverviewStatusCard, ExpiringSoonRow } from './types';

/**
 * The overview's "Highlights" row: the by-state certificate summary card beside a short list of the
 * certificates closest to expiring. When there are no certificates yet, an empty-state container
 * takes their place (matching the Workloads overview) - the issuer sections still render below, so
 * the user can see what to build against.
 */
defineProps<{
  summary: OverviewStatusCard;
  expiringSoon: ExpiringSoonRow[];
  hasCertificates: boolean;
  createRoute: RouteLocationRaw;
  resetNamespaceFilter:() => void;
}>();

const { t } = useI18n(useStore());
</script>

<template>
  <div
    class="section"
    data-testid="cert-manager-overview-certificates"
  >
    <template v-if="hasCertificates">
      <h4 class="mm-0 text-deemphasized">
        {{ t('certManager.overview.sections.highlights') }}
      </h4>

      <div class="card-grid">
        <OverviewCard :card="summary" />

        <Card :title="t('certManager.overview.expiry.expiringSoon')">
          <ul
            v-if="expiringSoon.length"
            class="expiring-soon"
            data-testid="cert-manager-overview-expiring-soon"
          >
            <li
              v-for="row in expiringSoon"
              :key="row.name"
              class="expiring-row"
            >
              <span
                class="dot"
                :style="{ backgroundColor: stateColorCssVar(row.color) }"
                aria-hidden="true"
              />
              <span class="name">
                <SubtleLink :to="row.to">{{ row.name }}</SubtleLink>
              </span>
              <span class="detail text-muted">{{ row.detail }}</span>
            </li>
          </ul>

          <div
            v-else
            class="text-muted"
          >
            {{ t('certManager.overview.expiry.none') }}
          </div>
        </Card>
      </div>
    </template>

    <div
      v-else
      class="empty-state"
      data-testid="cert-manager-overview-certificates-empty"
    >
      <h1 class="mm-0">
        {{ t('certManager.overview.certificatesEmpty.title') }}
      </h1>
      <div class="empty-state-tips">
        <RichTranslation k="certManager.overview.certificatesEmpty.message">
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
          k="certManager.overview.certificatesEmpty.docsMessage"
          tag="div"
        >
          <template #docsLink="{ content }">
            <SubtleLink
              :href="CERT_MANAGER_DOCS"
              target="_blank"
              :open-in-new-tab-label="t('generic.opensInNewTab')"
            >
              {{ content }}
            </SubtleLink>
          </template>
        </RichTranslation>
      </div>
      <div>
        <RcButton
          variant="primary"
          size="large"
          :to="createRoute"
          data-testid="cert-manager-overview-create-certificate"
        >
          {{ t('certManager.overview.empty.createCertificate') }}
        </RcButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  h4 {
    line-height: 21px;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-md);
  // Stretch both cards to a shared height (the taller of the two) so the row reads as one
  // band - matching the workload overview.
  align-items: stretch;

  // Grid children stretch to the row height by default; make sure the card content fills it too
  // rather than leaving the shorter card's body floating at the top.
  > * {
    height: 100%;
  }
}

.expiring-soon {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  list-style: none;
  margin: 0;
  padding: 0;

  .expiring-row {
    align-items: center;
    display: flex;
    gap: var(--gap);
    line-height: 24px;

    .dot {
      border-radius: 50%;
      flex: 0 0 auto;
      height: 10px;
      width: 10px;
    }

    .name {
      flex-grow: 1;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 72px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  h1 {
    line-height: 38px;
  }

  .empty-state-tips {
    font-size: 16px;
    line-height: 29px;
  }
}
</style>
