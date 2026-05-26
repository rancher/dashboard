<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';

export interface CardProps {
    title?: string;
    to?: RouteLocationRaw;
    bodyColumns?: number;
}

const { title, to, bodyColumns } = defineProps<CardProps>();
const slots = useSlots();
const router = useRouter();

const clickable = computed(() => !!to);
const cursorValue = computed(() => clickable.value ? 'pointer' : 'auto');
const showHeading = computed(() => !!title || !!slots.title || !!slots['heading-action']);
const gridColumns = computed(() => bodyColumns ? `repeat(${ bodyColumns }, 1fr)` : 'none');

function handleClick(e: MouseEvent | KeyboardEvent): void {
  if (!to) {
    return;
  }

  const target = e.target as HTMLElement;

  if (target.closest('a, button')) {
    return;
  }

  router.push(to);
}
</script>

<template>
  <div
    class="detail-card"
    :class="{ clickable: clickable }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <template v-if="showHeading">
      <div class="heading">
        <slot name="heading">
          <div class="title">
            <slot name="title">
              {{ title }}
            </slot>
          </div>
        </slot>
        <slot name="heading-action" />
      </div>
      <VerticalGap />
    </template>
    <div
      class="body"
      :class="{ 'body--grid': bodyColumns, 'body--grid-0': bodyColumns === 0 }"
    >
      <slot name="default" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail-card {
    padding: 16px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border);
    cursor: v-bind(cursorValue);

    &.clickable:hover {
      border-color: var(--primary);
    }

    .heading {
      display: flex;
      justify-content: space-between;

      height: 32px;

      .title {
          font-size: 18px;
          font-weight: 600;
          line-height: 21px;
      }
    }

    .body {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      &--grid-0 {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      &--grid {
        display: grid;
        grid-template-columns: v-bind(gridColumns);
        gap: 4px 48px;
      }
    }
}
</style>
