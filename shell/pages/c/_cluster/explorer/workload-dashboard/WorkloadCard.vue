<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { stateColorCssVar, type StateColor } from '@shell/utils/style';

export interface WorkloadCardRow {
  label: string;
  to?: RouteLocationRaw;
  color?: StateColor;
  counts?: { label: string; count: number }[];
}

const { bodyColumns } = defineProps<{
  bodyColumns?: number;
  rows: WorkloadCardRow[];
  ariaLabel?: string;
}>();

const gridColumns = computed(() => bodyColumns ? `repeat(${ bodyColumns }, 1fr)` : 'none');
</script>

<template>
  <div
    class="workload-card"
    role="group"
    :aria-label="ariaLabel"
  >
    <ul
      class="body"
      :class="{ 'body--grid': bodyColumns }"
    >
      <li
        v-for="(row, idx) in rows"
        :key="idx"
        class="resource-row"
      >
        <span
          class="state-dot"
          :style="{ backgroundColor: row.color ? stateColorCssVar(row.color) : undefined }"
          aria-hidden="true"
        />
        <span class="left">
          <SubtleLink
            v-if="row.to && row.counts?.length"
            :to="row.to"
          >
            {{ row.label }}
          </SubtleLink>
          <span
            v-else
            class="text-deemphasized"
          >
            {{ row.label }}
          </span>
        </span>
        <span class="right">
          <span
            v-if="!row.counts?.length"
            class="text-deemphasized"
          >
            0
          </span>
          <span
            v-else
            class="counts"
          >
            <span
              v-for="(c, i) in row.counts"
              :key="c.label"
              class="count"
            >
              <span class="count-value">{{ c.count }}</span>&nbsp;<span class="count-label">{{ c.label }}</span><span
                v-if="i < row.counts.length - 1"
                aria-hidden="true"
              >&nbsp;+&nbsp;</span>
            </span>
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.workload-card {
  padding: 16px;
  border-radius: var(--border-radius-md);

  .body {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;

    &--grid {
      display: grid;
      grid-template-columns: v-bind(gridColumns);
      gap: 4px 48px;
    }
  }

  .resource-row {
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 20px;
    line-height: 21px;
    height: 24px;

    .left {
      flex-grow: 1;
    }

    .right {
      flex-grow: 1;
      text-align: right;
      overflow: hidden;
    }

    .counts {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      max-width: 100%;
      overflow: hidden;

      .count {
        display: flex;
        justify-content: flex-end;
        min-width: 0;
      }

      .count:first-child {
        max-width: calc(100% - 90px);

        .count-label {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .state-dot {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
}
</style>
