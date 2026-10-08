<script setup lang="ts">
import { useRouter } from 'vue-router';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { stateColorCssVar } from '@shell/utils/style';
import type { StatusSummaryCardProps } from './types';

/**
 * A stacked status bar above one row per state (indicator, label, count). Each row can deep-link to
 * the resource list filtered to its state, and when `to` is set a plain click anywhere else on the
 * card opens the unfiltered list.
 *
 * When there are no rows the `empty` slot is rendered, so consumers that list empty groups can add
 * their own message. Consumers that hide empty groups pass no slot.
 */
const props = defineProps<StatusSummaryCardProps>();

defineSlots<{ empty?:() => unknown }>();

const router = useRouter();

// Let text selection and inner links work, but treat a plain click anywhere on the card as "open
// the list".
function handleClick(e: MouseEvent | KeyboardEvent): void {
  if (!props.to) {
    return;
  }

  const target = e.target as HTMLElement;

  if (target.closest('a, button') || window.getSelection()?.toString()) {
    return;
  }

  router.push(props.to);
}
</script>

<template>
  <Card
    class="status-summary-card"
    :class="{ clickable: !!to }"
    :title="title"
    data-testid="status-summary-card"
    role="group"
    :tabindex="to ? 0 : undefined"
    :aria-label="`${ title }: ${ total } total`"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <StatusBar
      v-if="segments.length"
      :segments="segments"
      class="align-center"
      aria-hidden="true"
    />
    <VerticalGap />
    <ul
      v-if="rows.length"
      class="rows"
    >
      <li
        v-for="row in rows"
        :key="row.key"
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
          <template v-else>{{ row.label }}</template>
        </span>
        <RcCounterBadge
          :count="row.count"
          type="inactive"
          :aria-label="`${ row.count } ${ row.label }`"
        />
      </li>
    </ul>
    <slot
      v-else
      name="empty"
    />
  </Card>
</template>

<style lang="scss" scoped>
.status-summary-card {
  &.clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--primary);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: -2px;
  }

  .align-center {
    align-items: center;
    display: flex;
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
}
</style>
