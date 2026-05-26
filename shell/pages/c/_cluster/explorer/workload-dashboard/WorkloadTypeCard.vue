<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
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
  <div
    class="workload-type-card"
    data-testid="resource-detail-status-card"
    role="button"
    tabindex="0"
    :aria-label="`${ title }: ${ total } total`"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <h5 class="heading">
      {{ title }}
    </h5>
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
  </div>
</template>

<style lang="scss" scoped>
.workload-type-card {
  padding: 16px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border);
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: var(--primary);
  }

  .heading {
    font-size: 18px;
    font-weight: 600;
    line-height: 21px;
    height: 32px;
    margin: 0;
  }

  .rows {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .status-row {
    display: flex;
    align-items: center;

    &:not(:first-of-type) {
      margin-top: 8px;
    }

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
