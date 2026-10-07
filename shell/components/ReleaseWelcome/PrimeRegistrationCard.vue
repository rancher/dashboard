<script setup lang="ts">
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import { PRIME_BENEFITS, SCC_URL, SUPPORT_HANDBOOK_URL } from '@shell/config/release-welcome';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';

const store = useStore();
const { t } = useI18n(store);

const SUPPORT_BENEFIT = 'releaseWelcome.registration.benefits.support';
</script>

<template>
  <PrimeCard
    aria-labelledby="release-welcome-registration-title"
    data-testid="release-welcome-registration"
  >
    <h3 id="release-welcome-registration-title">
      {{ t('releaseWelcome.registration.title', {}, true) }}
    </h3>
    <p>{{ t('releaseWelcome.registration.description', {}, true) }}</p>
    <ul class="benefits">
      <li
        v-for="benefit in PRIME_BENEFITS"
        :key="benefit"
      >
        <i
          class="icon icon-checkmark"
          aria-hidden="true"
        />
        <span class="benefit">
          {{ t(benefit, {}, true) }}
          <a
            v-if="benefit === SUPPORT_BENEFIT"
            :href="SUPPORT_HANDBOOK_URL"
            target="_blank"
            rel="noopener noreferrer nofollow"
            data-testid="release-welcome-support-handbook"
          >
            {{ t('releaseWelcome.registration.supportHandbook') }}
            <i
              class="icon icon-external-link"
              aria-hidden="true"
            />
            <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
          </a>
        </span>
      </li>
    </ul>
    <RcButton
      class="cta"
      variant="primary"
      :href="SCC_URL"
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-testid="release-welcome-registration-open"
    >
      {{ t('releaseWelcome.registration.open', {}, true) }}
      <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
    </RcButton>
  </PrimeCard>
</template>

<style lang="scss" scoped>
.benefits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 21px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .icon-checkmark {
    margin-top: 3px;
    color: var(--success);
  }
}

.benefit {
  display: flex;
  flex-direction: column;
  gap: 3px;

  a {
    font-size: 13px;
  }
}

.cta {
  margin-top: 4px;
}
</style>
