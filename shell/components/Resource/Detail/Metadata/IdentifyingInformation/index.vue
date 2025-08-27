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
    dataTestid?: string;
    valueDataTestid?: string;
    status?: 'success' | 'warning' | 'info' | 'error',
}

export interface MetadataProps {
  rows: Row[];
}
</script>

<script setup lang="ts">
const { rows } = defineProps<MetadataProps>();

const getRowValueId = (row:Row): string => `value-${ row.label }:${ row.value }`.toLowerCase().replaceAll(' ', '');
</script>

<template>
  <div class="identifying-information">
    <div
      v-for="row in rows"
      :key="`${row.label}:${row.value}`"
      class="row"
      :data-testid="row.dataTestid"
    >
      <label
        class="label text-deemphasized"
        :for="getRowValueId(row)"
      >
        {{ row.label }}
      </label>
      <!-- A custom component specified as an object, responsible for it's own styling -->
      <div
        v-if="typeof row.valueOverride?.component !== 'string' && row.valueOverride?.component && row.value"
        :id="getRowValueId(row)"
        class="full-custom-value"
      >
        <component
          :is="row.valueOverride?.component"
          v-if="row.valueOverride?.component"
          v-bind="row.valueOverride?.props"
          :data-testid="row.valueDataTestid"
        />
      </div>
      <!-- A formatter with a component specified as a string -->
      <div
        v-else-if="row.valueOverride?.component && row.value"
        :id="getRowValueId(row)"
        class="value"
      >
        <component
          :is="row.valueOverride?.component"
          v-if="row.valueOverride?.component"
          v-bind="row.valueOverride?.props"
          :data-testid="row.valueDataTestid"
        />
      </div>
      <div
        v-else
        :id="getRowValueId(row)"
        class="value"
      >
        <div
          v-if="row.status"
          :class="['status', row.status]"
        />
        <router-link
          v-if="row.value && row.to"
          :to="row.to"
          :data-testid="row.valueDataTestid"
        >
          {{ row.value }}
        </router-link>
        <span
          v-else-if="row.value"
          :data-testid="row.valueDataTestid"
          tabindex="0"
          :aria-label="row.value"
        >{{ row.value }}</span>
        <span
          v-else
          class="text-muted"
          :data-testid="row.valueDataTestid"
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

      .full-custom-value {
        flex: 1;
      }

      .value {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;

        & > div, & > span {
          max-width: 100%;
        }

        &, & > div, & > span {
          @include clip;
        }
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
