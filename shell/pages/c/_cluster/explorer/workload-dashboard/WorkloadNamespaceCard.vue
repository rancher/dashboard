<script setup lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StateDot from '@shell/components/StateDot/index.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import type { WorkloadDashboardByNamespaceCardRow, WorkloadDashboardNamespaceNavigateFn, WorkloadDashboardFilterByNamespaceFn } from './types';

const props = defineProps<{
  title: string;
  rows: WorkloadDashboardByNamespaceCardRow[];
  navigateToNamespace: WorkloadDashboardNamespaceNavigateFn;
  filterByNamespace: WorkloadDashboardFilterByNamespaceFn;
}>();

function handleCardClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  if (target.closest('a')) {
    return;
  }

  props.filterByNamespace(props.title);
}

function handleTypeClick(type: string): void {
  props.navigateToNamespace(type, props.title);
}

function handleCountClick(type: string, stateNames: string[]): void {
  props.navigateToNamespace(type, props.title, stateNames);
}
</script>

<template>
  <Card
    class="workload-namespace-card"
    data-testid="workload-dashboard-namespace-card"
    tabindex="0"
    role="group"
    :aria-label="title"
    @click="handleCardClick"
    @keyup.enter="filterByNamespace(title)"
  >
    <template
      #title
    >
      <div class="align-center">
        {{ title }}
      </div>
    </template>
    <ul
      v-if="rows.length > 0"
      class="rows"
    >
      <li
        v-for="row in rows"
        :key="row.type"
        class="resource-row"
      >
        <span class="label">
          <SubtleLink
            href="#"
            @click.prevent="handleTypeClick(row.type)"
          >
            {{ row.label }}
          </SubtleLink>
        </span>
        <span class="counts">
          <span
            v-for="c in row.counts"
            :key="c.color"
            class="count-entry"
          >
            <SubtleLink
              href="#"
              @click.prevent="handleCountClick(row.type, c.stateNames)"
            >
              <div class="count-entry-count">{{ c.count }}</div>
            </SubtleLink>
            <StateDot :color="c.color" />
          </span>
        </span>
      </li>
    </ul>
  </Card>
</template>

<style lang="scss" scoped>
.workload-namespace-card {
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
    height: 100%;
  }

  .rows {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 4px;
  }

  .resource-row {
    display: flex;
    align-items: center;
    line-height: 24px;

    .label {
      flex-grow: 1;
    }

    .counts {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .count-entry {
      display: flex;
      align-items: center;
      gap: 12px;

      .count-entry-count {
        text-align: right;
        min-width: 20px;
      }
    }
  }
}
</style>
