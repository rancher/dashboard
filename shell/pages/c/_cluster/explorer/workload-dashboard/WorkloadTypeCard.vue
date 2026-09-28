<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { stateColorCssVar, type StateColor } from '@shell/utils/style';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import type { WorkloadDashboardResourceRouteFn } from './types';

interface Resource {
  stateDisplay: string;
  stateId: string;
  stateSimpleColor: StateColor;
  count: number;
}

const props = defineProps<{
  title: string;
  type: string;
  resourceRoute: WorkloadDashboardResourceRouteFn;
  resources: Resource[];
}>();

const router = useRouter();

const total = computed(() => props.resources.reduce((sum, r) => sum + r.count, 0));

const segments = computed(() => {
  const byColor: Record<string, number> = {};

  for (const r of props.resources) {
    byColor[r.stateSimpleColor] = (byColor[r.stateSimpleColor] || 0) + r.count;
  }

  return Object.entries(byColor).map(([color, count]) => ({
    color:   color as StateColor,
    percent: (count / total.value) * 100,
  }));
});

function handleClick(e: MouseEvent | KeyboardEvent): void {
  const target = e.target as HTMLElement;

  if (target.closest('a, button')) {
    return;
  }

  if (window.getSelection()?.toString()) {
    return;
  }

  router.push(props.resourceRoute(props.type));
}
</script>

<template>
  <Card
    class="workload-type-card"
    data-testid="resource-detail-status-card"
    role="group"
    tabindex="0"
    :aria-label="`${ title }: ${ total } total`"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <StatusBar
      v-if="resources.length > 0"
      :segments="segments"
      class="align-center"
      aria-hidden="true"
    />
    <VerticalGap />
    <template
      #title
    >
      <div class="align-center full-height">
        {{ title }}
      </div>
    </template>
    <ul
      v-if="resources.length > 0"
      class="rows"
    >
      <li
        v-for="r in resources"
        :key="r.stateId"
        class="status-row"
      >
        <span
          class="indicator"
          :style="{ backgroundColor: stateColorCssVar(r.stateSimpleColor) }"
          aria-hidden="true"
        />
        <span class="label">
          <SubtleLink :to="resourceRoute(type, [r.stateId])">
            {{ r.stateDisplay }}
          </SubtleLink>
        </span>
        <RcCounterBadge
          :count="r.count"
          type="inactive"
          :aria-label="`${ r.count } ${ r.stateDisplay }`"
        />
      </li>
    </ul>
  </Card>
</template>

<style lang="scss" scoped>
.workload-type-card {
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

  .full-height {
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
