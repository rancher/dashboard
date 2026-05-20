<script setup lang="ts">
import { computed, useSlots } from 'vue';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';

export interface CardProps {
    title?: string;
}

const { title } = defineProps<CardProps>();
const slots = useSlots();

const showHeading = computed(() => !!title || !!slots.title || !!slots['heading-action']);
</script>

<template>
  <div class="detail-card">
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
    <div class="body">
      <slot name="default" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail-card {
    padding: 16px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border);

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
    }
}
</style>
