<script setup lang="ts">
import WidgetCard from './WidgetCard.vue';
import { useWidgetRows } from '../../composables/useWidgetRows';
import { fieldValue, stateColor } from '../../templating/widget-data';
import type { ResourceRow, WidgetSpec } from '../../templating/types';

/**
 * A compact feed: one line per row — a lead word (its state or type, coloured), the row's name and
 * whatever message it carries. That is the shape of every feed on a dashboard, so this is not
 * configurable beyond the resource, the filter and how many lines to show.
 */
const props = defineProps<{ widget: WidgetSpec }>();

const {
  rows, visibleRows, loading, error, emptyText
} = useWidgetRows(() => props.widget);

const lead = (row: ResourceRow) => fieldValue(row, 'type') || fieldValue(row, 'state') || '';
const leadColor = (row: ResourceRow) => stateColor(lead(row));
const name = (row: ResourceRow) => fieldValue(row, 'name');
const message = (row: ResourceRow) => fieldValue(row, 'message');
</script>

<template>
  <WidgetCard
    :title="widget.title"
    :loading="loading"
    :error="error"
    :empty="!rows.length"
    :empty-text="emptyText"
  >
    <ul class="wlist">
      <li
        v-for="(row, i) in visibleRows"
        :key="row.id || i"
      >
        <span
          v-if="lead(row)"
          class="wlist__lead"
          :class="`wlist__lead--${ leadColor(row) }`"
        >{{ lead(row) }}</span>
        <span class="wlist__text">
          <span class="wlist__name">{{ name(row) }}</span>
          <template v-if="message(row)">: {{ message(row) }}</template>
        </span>
      </li>
    </ul>
  </WidgetCard>
</template>

<style lang="scss" scoped>
.wlist {
  display:        flex;
  flex-direction: column;
  gap:            8px;
  list-style:     none;
  margin:         0;
  padding:        0;

  li {
    display: flex;
    gap:     12px;
  }

  &__lead {
    flex:        0 0 auto;
    font-weight: 600;
    min-width:   64px;

    &--success {
      color: var(--success);
    }

    &--warning {
      color: var(--warning);
    }

    &--error {
      color: var(--error);
    }

    &--info {
      color: var(--body-text);
    }
  }

  &__text {
    min-width:     0;
    overflow:      hidden;
    text-overflow: ellipsis;
    white-space:   nowrap;
  }

  &__name {
    font-weight: 500;
  }
}
</style>
