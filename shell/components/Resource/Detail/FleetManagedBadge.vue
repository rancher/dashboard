<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { BadgeState } from '@components/BadgeState';
import { FLEET } from '@shell/config/labels-annotations';
import { useI18n } from '@shell/composables/useI18n';

const props = defineProps<{ resource?: { metadata?: { labels?: Record<string, string> } } }>();

const { t } = useI18n(useStore());

const isFleetManaged = computed(() => !!props.resource?.metadata?.labels?.[FLEET.MANAGED_BY_KIND]);
</script>

<template>
  <BadgeState
    v-if="isFleetManaged"
    class="fleet-managed-badge"
    icon="icon-fleet"
    :label="t('resourceDetail.masthead.fleetManagedBadge')"
    data-testid="fleet-managed-badge"
  />
</template>

<style lang="scss" scoped>
.fleet-managed-badge {
  flex: 0 0 auto;
  margin-left: 12px;
  font-size: 16px;
  color: var(--link-text-secondary);
  background: var(--rc-inactive-background);
}
</style>
