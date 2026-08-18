<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { stateColorCssVar } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';
import OverviewCard from './OverviewCard.vue';
import OverviewStat from './OverviewStat.vue';
import type { OverviewStatusCard, OverviewExpiryTile, ExpiringSoonRow } from './types';

/**
 * Certificates: a by-state summary card, coloured tiles counting how soon certificates expire, and a
 * short list of the ones expiring soonest. When there are no certificates yet, an inline prompt takes
 * their place - the issuer sections still render above, so the user can see what to build against.
 */
defineProps<{
  summary: OverviewStatusCard;
  tiles: OverviewExpiryTile[];
  expiringSoon: ExpiringSoonRow[];
  expiringSoonOverflow: number;
  listRoute: RouteLocationRaw;
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
        {{ t('certManager.overview.expiry.title') }}
      </h4>

      <div
        v-if="tiles.length"
        class="expiry-grid"
      >
        <OverviewStat
          v-for="tile in tiles"
          :key="tile.key"
          :card="tile"
        />
      </div>

      <OverviewCard :card="summary">
        <template #aside>
          <h4 class="mm-0 text-deemphasized">
            {{ t('certManager.overview.expiry.expiringSoon') }}
          </h4>

          <template v-if="expiringSoon.length">
            <ul
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
            <SubtleLink
              v-if="expiringSoonOverflow > 0"
              :to="listRoute"
              data-testid="cert-manager-overview-expiring-more"
            >
              {{ t('certManager.overview.expiry.more', { count: expiringSoonOverflow }) }}
            </SubtleLink>
          </template>

          <div
            v-else
            class="text-muted"
          >
            {{ t('certManager.overview.expiry.none') }}
          </div>
        </template>
      </OverviewCard>
    </template>

    <div
      v-else
      class="empty-inline"
      data-testid="cert-manager-overview-certificates-empty"
    >
      <p class="mm-0">
        {{ t('certManager.overview.empty.noCertificates') }}
      </p>
      <SubtleLink :to="createRoute">
        {{ t('certManager.overview.empty.createCertificate') }}
      </SubtleLink>
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

// Fixed-width tracks left-aligned: fewer tiles keep their width rather than stretching to fill.
.expiry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 15px;
}

// The Expiring Soonest list lives in the card's right column, so it stays borderless and shares the
// left column's row rhythm rather than reading as a nested box.
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
  border: 1px dashed var(--border);
  border-radius: var(--border-radius-md);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap);
}
</style>
