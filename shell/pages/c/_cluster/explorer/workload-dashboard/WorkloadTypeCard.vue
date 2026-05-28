<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { stateColorCssVar, type StateColor } from '@shell/utils/style';

interface Resource {
  stateDisplay: string;
  stateId: string;
  stateSimpleColor: StateColor;
  count: number;
}

const props = defineProps<{
  title: string;
  to: RouteLocationRaw;
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

function rowRoute(stateId: string): RouteLocationRaw {
  return {
    ...(props.to as object),
    query: { q: `"metadata.state.name":"${ stateId }"` },
  };
}

function handleClick(e: MouseEvent | KeyboardEvent): void {
  const target = e.target as HTMLElement;

  if (target.closest('a, button')) {
    return;
  }

  if (window.getSelection()?.toString()) {
    return;
  }

  router.push(props.to);
}
</script>

<template>
  <Card
    class="workload-type-card"
    :title="title"
    data-testid="resource-detail-status-card"
    role="button"
    tabindex="0"
    :aria-label="`${ title }: ${ total } total`"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <StatusBar
      v-if="resources.length > 0"
      :segments="segments"
      aria-hidden="true"
    />
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
          <SubtleLink :to="rowRoute(r.stateId)">
            {{ r.stateDisplay }}
          </SubtleLink>
        </span>
        <span
          class="count"
          :aria-label="`${ r.count } ${ r.stateDisplay }`"
        >
          {{ r.count }}
        </span>
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
