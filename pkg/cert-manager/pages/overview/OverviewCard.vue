<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import { stateColorCssVar } from '@shell/utils/style';
import type { OverviewStatusCard } from './types';

/**
 * A stacked-bar-plus-rows card, matching the workload dashboard's "by type" cards. The whole card
 * is a link to the resource list. Rows are informational only - see aggregate.ts for why they do
 * not deep-link to a state-filtered list.
 */
const props = defineProps<{ card: OverviewStatusCard }>();

const router = useRouter();
const { t } = useI18n(useStore());

// Let text selection and inner links work, but treat a plain click anywhere on the card as "open
// the list" - the same affordance the workload cards give.
function handleClick(e: MouseEvent | KeyboardEvent): void {
  const target = e.target as HTMLElement;

  if (target.closest('a, button') || window.getSelection()?.toString()) {
    return;
  }

  if (props.card.to) {
    router.push(props.card.to);
  }
}
</script>

<template>
  <Card
    class="overview-card"
    data-testid="cert-manager-overview-card"
    role="group"
    tabindex="0"
    :aria-label="`${ card.title }: ${ card.total } total`"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <template #heading>
      <div class="title-cell">
        <span class="title-text">{{ card.title }}</span>
      </div>
    </template>

    <div class="card-body">
      <StatusBar
        v-if="card.segments.length"
        :segments="card.segments"
        class="align-center"
        aria-hidden="true"
      />
      <VerticalGap />
      <ul
        v-if="card.rows.length"
        class="rows"
      >
        <li
          v-for="row in card.rows"
          :key="row.label"
          class="status-row"
        >
          <span
            class="indicator"
            :style="{ backgroundColor: stateColorCssVar(row.color) }"
            aria-hidden="true"
          />
          <span class="label">{{ row.label }}</span>
          <RcCounterBadge
            :count="row.count"
            type="inactive"
            :aria-label="`${ row.count } ${ row.label }`"
          />
        </li>
      </ul>
      <div
        v-else
        class="empty"
      >
        <span class="text-muted">{{ card.emptyLabel || t('certManager.overview.noneOfType') }}</span>
        <SubtleLink
          v-if="card.createAction"
          :to="card.createAction.to"
        >
          {{ card.createAction.label }}
        </SubtleLink>
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.overview-card {
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: -2px;
  }

  .align-center {
    align-items: center;
    display: flex;
  }

  .title-cell {
    align-items: center;
    display: flex;
    gap: var(--gap);

    .title-text {
      font-size: 18px;
      font-weight: 600;
      line-height: 21px;
    }
  }

  .rows {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 4px;
  }

  .status-row {
    display: flex;
    align-items: center;
    line-height: 24px;

    .indicator {
      height: 4px;
      border-radius: 4px;
      width: 20px;
      margin-right: 10px;
    }

    .label {
      flex-grow: 1;
    }
  }

  .empty {
    display: flex;
    align-items: baseline;
    gap: var(--gap);
    line-height: 24px;
  }
}
</style>
