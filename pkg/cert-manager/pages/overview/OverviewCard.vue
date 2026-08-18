<script setup lang="ts">
import { computed, useSlots } from 'vue';
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
 * is a link to the resource list; individual rows deep-link to the list pre-filtered by state.
 *
 * An optional `#aside` slot adds a second column beside the rows - used by the Certificates card to
 * carry the "Expiring Soonest" list. Its `#aside-heading` sits on the header line beside the title,
 * so both certificate summaries read as one two-column panel.
 */
const props = defineProps<{ card: OverviewStatusCard }>();

const router = useRouter();
const { t } = useI18n(useStore());

const slots = useSlots();
const hasAside = computed(() => !!slots.aside);

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
      <div
        class="overview-heading"
        :class="{ 'has-aside': hasAside }"
      >
        <div class="title-cell">
          <span class="title-text">{{ card.title }}</span>
          <RcCounterBadge
            :count="card.total"
            type="inactive"
            :aria-label="`${ card.total } ${ card.title }`"
          />
        </div>
        <div
          v-if="hasAside"
          class="aside-cell"
        >
          <slot name="aside-heading" />
        </div>
      </div>
    </template>

    <div
      class="card-body"
      :class="{ 'has-aside': hasAside }"
    >
      <div class="main">
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
            <span class="label">
              <SubtleLink
                v-if="row.to"
                :to="row.to"
              >
                {{ row.label }}
              </SubtleLink>
              <span v-else>{{ row.label }}</span>
            </span>
            <RcCounterBadge
              :count="row.count"
              type="inactive"
              :aria-label="`${ row.count } ${ row.label }`"
            />
          </li>
        </ul>
        <div
          v-else
          class="text-muted empty"
        >
          {{ t('certManager.overview.noneOfType') }}
        </div>
      </div>

      <div
        v-if="hasAside"
        class="aside"
      >
        <slot name="aside" />
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

  // The header fills the row so the title sits left and, without an aside, the total badge sits on
  // the far right - the workload-card look the Issuer and ACME cards keep.
  .overview-heading {
    align-items: center;
    display: flex;
    flex: 1;

    .title-cell {
      align-items: center;
      display: flex;
      flex: 1;
      gap: var(--gap);
      justify-content: space-between;
    }

    .title-text {
      font-size: 18px;
      font-weight: 600;
      line-height: 21px;
    }

    // With an aside, the header mirrors the body's two columns: the title on the left with its total
    // at the end of the bar (this column's right edge), and the "Expiring Soonest" heading up on the
    // same line on the right.
    &.has-aside {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--gap-lg);

      .title-cell {
        flex: none;
      }

      .aside-cell {
        align-items: center;
        display: flex;
      }
    }
  }

  // With an aside, split the body into two aligned columns: the bar and rows on the left, the
  // slotted content (the Expiring Soonest list) on the right.
  .card-body.has-aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);
    align-items: start;

    // Each row's count stays right-aligned to the end of the bar (the right edge of this column),
    // matching the workload cards.
    .aside {
      display: flex;
      flex-direction: column;
      gap: var(--gap);
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
    line-height: 24px;
  }
}
</style>
