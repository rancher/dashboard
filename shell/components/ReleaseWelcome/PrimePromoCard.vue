<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { RcTag } from '@components/Pill';
import { useI18n } from '@shell/composables/useI18n';
import { PRIME_PRODUCTS, PRIME_URL } from '@shell/config/release-welcome';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';
import { FirstRunPrimePromo } from '@shell/utils/dynamic-content/types';

const props = defineProps({
  /**
   * Promotion from dynamic content, the built-in promotion is shown when not set
   */
  promo: {
    type:    Object as PropType<FirstRunPrimePromo>,
    default: undefined
  }
});

const store = useStore();
const { t } = useI18n(store);

const content = computed<FirstRunPrimePromo>(() => props.promo || {
  title:       t('releaseWelcome.prime.title', {}, true),
  description: t('releaseWelcome.prime.description', {}, true),
  products:    PRIME_PRODUCTS.map((product) => t(product, {}, true)),
  cta:         { action: t('releaseWelcome.prime.explore', {}, true), link: PRIME_URL },
});
</script>

<template>
  <PrimeCard
    aria-labelledby="release-welcome-prime-title"
    data-testid="release-welcome-prime"
  >
    <h3 id="release-welcome-prime-title">
      {{ content.title }}
    </h3>
    <p>{{ content.description }}</p>
    <ul
      v-if="content.products.length"
      class="products"
    >
      <li
        v-for="(product, i) in content.products"
        :key="i"
      >
        <RcTag type="inactive">
          {{ product }}
        </RcTag>
      </li>
    </ul>
    <RcButton
      class="cta"
      variant="primary"
      size="small"
      :href="content.cta.link"
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-testid="release-welcome-prime-explore"
    >
      {{ content.cta.action }}
      <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
    </RcButton>
  </PrimeCard>
</template>

<style lang="scss" scoped>
.products {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;

  // Pill shaped chips in the theme font
  :deep(.rc-tag) {
    padding: 6px 12px;
    border-radius: 100px;
    font-family: inherit;
    font-size: 12px;
    line-height: 16px;
  }
}

.cta {
  margin-top: 4px;
  font-weight: 600;
}
</style>
