<script setup lang="ts">
import { computed } from 'vue';
import { RcButton } from '@components/RcButton';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { MANAGEMENT } from '@shell/config/types';
import { NAME as SETTINGS } from '@shell/config/product/settings';
import { BLANK_CLUSTER } from '@shell/store/store-types';

const PRIME_URL = 'https://www.suse.com/products/rancher/';

const props = defineProps<{
  /** Whether this is Rancher Prime, where the limit comes from a feature flag being off. */
  prime?: boolean;
}>();

const key = computed(() => (props.prime ? 'authConfig.list.primeFlagOff' : 'authConfig.list.prime'));

const featureFlagsLocation = {
  name:   'c-cluster-product-resource',
  params: {
    cluster: BLANK_CLUSTER, product: SETTINGS, resource: MANAGEMENT.FEATURE
  },
};
</script>

<template>
  <div
    class="auth-providers-prime"
    data-testid="auth-config-prime-notice"
  >
    <h3 class="auth-providers-prime__title">
      {{ t(`${ key }.title`) }}
    </h3>
    <p class="auth-providers-prime__description">
      <RichTranslation
        :k="`${ key }.description`"
        tag="span"
      >
        <template #primeUrl="{ content }">
          <SubtleLink
            :href="PRIME_URL"
            target="_blank"
          >
            {{ content }}
          </SubtleLink>
        </template>
      </RichTranslation>
    </p>
    <div>
      <rc-button
        v-if="prime"
        variant="secondary"
        size="small"
        :to="featureFlagsLocation"
        data-testid="auth-config-prime-notice-action"
      >
        {{ t(`${ key }.action`) }}
      </rc-button>
      <rc-button
        v-else
        variant="secondary"
        size="small"
        :href="PRIME_URL"
        target="_blank"
        rel="noopener noreferrer nofollow"
        data-testid="auth-config-prime-notice-action"
      >
        {{ t(`${ key }.action`) }}
      </rc-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-providers-prime {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  padding: 16px;

  background-color: var(--box-bg);
  border-radius: var(--border-radius);

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 21px;
  }

  &__description {
    margin: 0;
    font-size: 12px;
    line-height: 18px;
  }
}
</style>
