<script setup lang="ts">
import { computed } from 'vue';
import { FLEET } from '@shell/config/labels-annotations';

const props = defineProps<{ resource?: { metadata?: { labels?: Record<string, string> } } }>();

const isFleetManaged = computed(() => !!props.resource?.metadata?.labels?.[FLEET.MANAGED_BY_KIND]);
</script>

<template>
  <span
    v-if="isFleetManaged"
    class="fleet-managed-badge"
    data-testid="fleet-managed-badge"
  >
    <i
      class="icon icon-fleet-alt mr-5"
      aria-hidden="true"
    />
    {{ t('resourceDetail.masthead.fleetManagedBadge') }}
  </span>
</template>

<style lang="scss" scoped>
.fleet-managed-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: 12px;
  padding: 2px 10px;
  border: 1px solid transparent;
  border-radius: 20px;
  font-size: 16px;
  color: var(--link-text-secondary);
  background: var(--rc-inactive-background);

  .icon {
    font-size: 18px;
  }
}
</style>
