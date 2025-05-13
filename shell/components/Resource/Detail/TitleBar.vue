<script lang="ts">
import BadgeState from '~/pkg/rancher-components/src/components/BadgeState/BadgeState.vue';
import { RouteLocationRaw, RouteLocationNormalizedLoaded } from 'vue-router';
import { Store } from 'vuex';

export interface Badge {
  color: 'bg-success' | 'bg-error' | 'bg-warning' | 'bg-info';
  label: string;
}

export interface TitleBarProps {
  resourceTypeLabel: string;
  resourceTo?: RouteLocationRaw;
  resourceName: string;

  description?: string;
  badge?: Badge;
}

export const extractDefaultTitleBarData = (resource: any, route: RouteLocationNormalizedLoaded, store: Store<any> ): TitleBarProps => {
  return {
    resourceTypeLabel: store.getters['type-map/labelFor']({ id: resource.type }, 2),
    resourceTo:        {
      name:   'c-cluster-product-resource',
      params: {
        product:   'explorer',
        cluster:   route.params.cluster,
        namespace: resource.namespace,
        resource:  resource.type
      }
    },
    resourceName: resource.nameDisplay,
    badge:        {
      color: resource.stateBackground,
      label: resource.stateDisplay
    }
  };
};
</script>

<script setup lang="ts">

const {
  resourceTypeLabel, resourceTo, resourceName, description, badge
} = defineProps<TitleBarProps>();
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
