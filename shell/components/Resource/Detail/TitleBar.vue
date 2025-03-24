<script setup lang="ts">
import BadgeState from '~/pkg/rancher-components/src/components/BadgeState/BadgeState.vue';

export interface Badge {
  color: 'bg-success' | 'bg-error' | 'bg-warning' | 'bg-info';
  label: string;
}

export interface Props {
  resourceTypeLabel: string;
  resourceTo?: string;
  resourceName: string;

  description: string;
  badge?: Badge;
}

const {
  resourceTypeLabel, resourceTo, resourceName, description, badge
} = defineProps<Props>();
</script>

<template>
  <div class="title-bar">
    <div class="top">
      <h1>
        <router-link
          v-if="resourceTo"
          :to="resourceTo"
        >
          {{ resourceTypeLabel }}:
        </router-link>
        <span v-else>
          {{ resourceTypeLabel }}:
        </span>
        {{ resourceName }}
        <BadgeState
          v-if="badge"
          :color="badge.color"
          :label="badge.label"
        />
      </h1>
    </div>
    <div
      v-if="description"
      class="bottom"
    >
      {{ description }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title-bar {

  h1 {
    display: inline-block;
    align-items: center;
    line-height: 18px;
  }

  &:deep() .badge-state {
    font-size: 16px;
    margin-left: 4px;
    top: -4px;
    position: relative;

  }
}
</style>
