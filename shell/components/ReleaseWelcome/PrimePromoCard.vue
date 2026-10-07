<script setup lang="ts">
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { RcTag } from '@components/Pill';
import { useI18n } from '@shell/composables/useI18n';
import { PRIME_PRODUCTS, PRIME_URL } from '@shell/config/release-welcome';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <PrimeCard
    aria-labelledby="release-welcome-prime-title"
    data-testid="release-welcome-prime"
  >
    <h3 id="release-welcome-prime-title">
      {{ t('releaseWelcome.prime.title', {}, true) }}
    </h3>
    <p>{{ t('releaseWelcome.prime.description', {}, true) }}</p>
    <ul class="products">
      <li
        v-for="product in PRIME_PRODUCTS"
        :key="product"
      >
        <RcTag type="inactive">
          {{ t(product, {}, true) }}
        </RcTag>
      </li>
    </ul>
    <RcButton
      class="cta"
      variant="primary"
      :href="PRIME_URL"
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-testid="release-welcome-prime-explore"
    >
      {{ t('releaseWelcome.prime.explore', {}, true) }}
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
}

.cta {
  margin-top: 4px;
}
</style>
