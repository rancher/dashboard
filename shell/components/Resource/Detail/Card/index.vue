<script setup lang="ts">
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';

export interface CardProps {
    title?: string;
}

const { title } = defineProps<CardProps>();

</script>

<template>
  <div class="detail-card">
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
    <div class="body">
      <slot name="default" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail-card {
    padding: 16px;
    border-radius: 4px;
    border: 1px solid var(--border);
    min-width: 300px;

    .vertical-gap {
        height: 12px;
    }

    .heading {
        height: 32px;

        .title {
            font-size: 18px;
            font-weight: 600;
            line-height: 21px;
        }
    }
}
</style>
