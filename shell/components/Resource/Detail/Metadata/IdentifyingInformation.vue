<script lang="ts">
import { I18n } from '@shell/composables/useI18n';
import { Vue } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import LiveDate from '@shell/components/formatter/LiveDate.vue';

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

export const extractDefaultIdentifyingInformation = (resource: any, i18n: I18n): Row[] => {
  return [
    {
      label: 'Namespace',
      value: resource.namespace,
    },
    {
      label:         'Age',
      valueOverride: {
        component: LiveDate,
        props:     { value: resource.creationTimestamp }
      },
      value: resource.age,
    },

  ];
};
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
      <div class="value">
        <span
          v-if="row.status"
          :class="['status', row.status]"
        >&nbsp;</span>
        <router-link
          v-if="row.to"
          :to="row.to"
        >
          {{ row.value }}
        </router-link>
        <span v-else>{{ row.value }}</span>
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
