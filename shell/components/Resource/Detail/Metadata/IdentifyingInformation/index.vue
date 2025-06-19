<script lang="ts">
import { RouteLocationRaw } from 'vue-router';

export interface Row {
    label: string;
    value?: string;
    valueOverride?: {
      component: any,
      props?: Object
    },
    to?: RouteLocationRaw;
    status?: 'success' | 'warning' | 'info' | 'error',
}

export interface MetadataProps {
  rows: Row[];
}
</script>

<script setup lang="ts">
const { rows } = defineProps<MetadataProps>();
</script>

<template>
  <div class="identifying-information">
    <div
      v-for="row in rows"
      :key="`${row.label}:${row.value}`"
      class="row"
    >
      <div class="label text-muted">
        {{ row.label }}
      </div>
      <div
        v-if="row.valueOverride?.component"
        class="value"
      >
        <component
          :is="row.valueOverride?.component"
          v-if="row.valueOverride?.component"
          v-bind="row.valueOverride?.props"
        />
      </div>
      <div
        v-else
        class="value"
      >
        <div
          v-if="row.status"
          :class="['status', row.status]"
        />
        <router-link
          v-if="row.value && row.to"
          :to="row.to"
        >
          {{ row.value }}
        </router-link>
        <span v-else-if="row.value">{{ row.value }}</span>
        <span
          v-else
          class="text-muted"
        >&mdash;</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.identifying-information {
    display: flex;
    flex-direction: column;

    .row {
      margin-bottom: 8px;

      .value {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .label {
        width: 30%;
        min-width: 120px;
      }

      .status {
        display: inline-block;
        $size: 8px;
        border-radius: 50%;
        width: $size;
        height: $size;
        margin-right: 12px;

        &.success {
          background-color: var(--success);
        }

        &.warning {
          background-color: var(--warning);
        }

        &.error {
          background-color: var(--error);
        }

        &.info {
          background-color: var(--info);
        }
      }

    }

}
</style>
