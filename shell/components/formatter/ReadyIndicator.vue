<script setup lang="ts">
import { computed } from 'vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';
import type { Status } from '@components/utils/status';

/**
 * Shows a ready count such as `2/3` next to a dot. The dot is green when everything is ready and red when not
 */
export interface Props {
  /**
   * The text to show, e.g. `2/3`
   */
  value?: string;
  ready?: number;
  total?: number;
  /**
   * Overrides the colour of the dot, e.g. `none` when readiness doesn't apply any more
   */
  status?: Status;
}

const props = withDefaults(defineProps<Props>(), {
  value: '', ready: 0, total: 0, status: undefined
});

const dotStatus = computed<Status>(() => {
  if (props.status) {
    return props.status;
  }

  return props.total > 0 && props.ready >= props.total ? 'success' : 'error';
});
</script>

<template>
  <span class="ready-indicator">
    <RcStatusIndicator
      shape="disc"
      :status="dotStatus"
    />
    <span>{{ props.value }}</span>
  </span>
</template>

<style lang="scss" scoped>
.ready-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
