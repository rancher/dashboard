<script setup lang="ts">
/**
 * How a provider is configured, summarised as label and value pairs above the
 * access form so that the provider being changed is never in doubt.
 *
 * Read-only: the values are changed from the provider's config page.
 */
import { computed } from 'vue';
import { useStore } from 'vuex';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
import { useI18n } from '@shell/composables/useI18n';
import { authProviderDetails } from '@shell/utils/auth-provider-details';

const props = withDefaults(defineProps<{
  /** The provider's Norman config */
  config: Record<string, any> | null;
  /** The provider's display name */
  name?: string;
}>(), { name: '' });

const store = useStore();
const i18n = useI18n(store);

const details = computed(() => authProviderDetails(props.config, i18n.t, props.name));
</script>

<template>
  <DrawerCard
    v-if="details.length"
    class="auth-provider-details-card"
  >
    <dl
      class="auth-provider-details"
      data-testid="auth-provider-details"
    >
      <div
        v-for="detail in details"
        :key="detail.label"
        class="auth-provider-details__item"
      >
        <dt class="auth-provider-details__label">
          {{ detail.label }}
        </dt>
        <dd class="auth-provider-details__value">
          {{ detail.value }}
        </dd>
      </div>
    </dl>
  </DrawerCard>
</template>

<style lang="scss" scoped>
.auth-provider-details-card {
  margin-bottom: 16px;
}

.auth-provider-details {
  display: grid;
  // Values are as long as whatever was configured, so they are given a column
  // each and left to wrap rather than squeezed onto one line
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin: 0;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    color: var(--label-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  &__value {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 21px;
    overflow-wrap: anywhere;
  }
}
</style>
