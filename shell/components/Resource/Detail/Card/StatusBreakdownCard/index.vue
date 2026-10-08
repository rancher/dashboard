<script setup lang="ts">
import { useStore } from 'vuex';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StateDot from '@shell/components/StateDot/index.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { useI18n } from '@shell/composables/useI18n';
import type { StatusBreakdownCardProps, StatusBreakdownCount, StatusBreakdownRow } from './types';

/**
 * One row per item (e.g. a resource type) with its counts grouped by state color. Each count is
 * followed by a dot in its color. The row label and each count can link to a filtered list.
 *
 * Link clicks also emit `select-row` and `select-count`, so consumers can do more than navigate
 * (e.g. set the namespace filter). When `selectable` is set a plain click anywhere else on the card
 * emits `select`.
 *
 * When there are no rows the `empty` slot is rendered.
 */
const props = defineProps<StatusBreakdownCardProps>();

const emit = defineEmits<{
  select: [];
  'select-row': [row: StatusBreakdownRow];
  'select-count': [row: StatusBreakdownRow, count: StatusBreakdownCount];
}>();

defineSlots<{ empty?:() => unknown }>();

const store = useStore();
const { t } = useI18n(store);

function countAriaLabel(row: StatusBreakdownRow, c: StatusBreakdownCount): string {
  return t('component.resource.detail.card.statusBreakdownCard.ariaLabel.count', {
    count: c.count,
    label: row.label,
    color: t(`component.resource.detail.card.statusBreakdownCard.color.${ c.color }`),
  });
}

// Let text selection and inner links work, but treat a plain click anywhere on the card as "select".
function handleClick(e: MouseEvent | KeyboardEvent): void {
  if (!props.selectable) {
    return;
  }

  const target = e.target as HTMLElement;

  if (target.closest('a, button') || window.getSelection()?.toString()) {
    return;
  }

  emit('select');
}
</script>

<template>
  <Card
    class="status-breakdown-card"
    :class="{ clickable: selectable }"
    :title="title"
    data-testid="status-breakdown-card"
    role="group"
    :tabindex="selectable ? 0 : undefined"
    :aria-label="title"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <ul
      v-if="rows.length"
      class="rows"
    >
      <li
        v-for="row in rows"
        :key="row.key"
        class="breakdown-row"
      >
        <span class="label">
          <SubtleLink
            v-if="row.to"
            :to="row.to"
            @click="emit('select-row', row)"
          >
            {{ row.label }}
          </SubtleLink>
          <template v-else>{{ row.label }}</template>
        </span>
        <span class="counts">
          <span
            v-for="c in row.counts"
            :key="c.color"
            class="count-entry"
          >
            <SubtleLink
              v-if="c.to"
              :to="c.to"
              class="count"
              :aria-label="countAriaLabel(row, c)"
              @click="emit('select-count', row, c)"
            >
              {{ c.count }}
            </SubtleLink>
            <span
              v-else
              class="count"
              :aria-label="countAriaLabel(row, c)"
            >{{ c.count }}</span>
            <StateDot
              :color="c.color"
              aria-hidden="true"
            />
          </span>
        </span>
      </li>
    </ul>
    <slot
      v-else
      name="empty"
    />
  </Card>
</template>

<style lang="scss" scoped>
.status-breakdown-card {
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

  .rows {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 4px;
  }

  .breakdown-row {
    display: flex;
    align-items: center;
    line-height: 24px;

    .label {
      flex-grow: 1;
    }

    .counts, .count-entry {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .count {
      display: inline-block;
      text-align: right;
      min-width: 20px;
    }
  }
}
</style>
