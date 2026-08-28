<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';
import SubtleLink from '@shell/components/SubtleLink.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { stateColorCssVar } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';
import OverviewCard from './OverviewCard.vue';
import type { OverviewStatusCard, ExpiringSoonRow } from './types';

/**
 * The overview's "Highlights" row: the by-state certificate summary card beside a short list of the
 * certificates closest to expiring. When there are no certificates yet, an inline prompt takes their
 * place - the issuer sections still render below, so the user can see what to build against.
 */
defineProps<{
  summary: OverviewStatusCard;
  expiringSoon: ExpiringSoonRow[];
  hasCertificates: boolean;
  createRoute: RouteLocationRaw;
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
      class="empty-inline"
      data-testid="cert-manager-overview-certificates-empty"
    >
      <p class="mm-0">
        {{ t('certManager.overview.empty.noCertificates') }}
      </p>
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
  gap: 15px;
  align-items: start;
}

.expiring-soon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;

  .expiring-row {
    align-items: center;
    display: flex;
    gap: 12px;
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

.empty-inline {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-lg);
}
</style>
