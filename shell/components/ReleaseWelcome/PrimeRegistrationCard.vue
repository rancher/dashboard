<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import { PRIME_BENEFITS, SCC_URL, SUPPORT_HANDBOOK_URL } from '@shell/config/release-welcome';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';
import { FirstRunRegistration } from '@shell/utils/dynamic-content/types';

const props = defineProps({
  /**
   * Card from dynamic content, the built-in card is shown when not set
   */
  registration: {
    type:    Object as PropType<FirstRunRegistration>,
    default: undefined
  }
});

const store = useStore();
const { t } = useI18n(store);

const SUPPORT_BENEFIT = 'releaseWelcome.registration.benefits.support';

const content = computed<FirstRunRegistration>(() => props.registration || {
  title:       t('releaseWelcome.registration.title', {}, true),
  description: t('releaseWelcome.registration.description', {}, true),
  benefits:    PRIME_BENEFITS.map((benefit) => ({
    text: t(benefit, {}, true),
    link: benefit === SUPPORT_BENEFIT ? { action: t('releaseWelcome.registration.supportHandbook'), link: SUPPORT_HANDBOOK_URL } : undefined,
  })),
  cta: { action: t('releaseWelcome.registration.open', {}, true), link: SCC_URL },
});
</script>

<template>
  <PrimeCard
    aria-labelledby="release-welcome-registration-title"
    data-testid="release-welcome-registration"
  >
    <h3 id="release-welcome-registration-title">
      {{ content.title }}
    </h3>
    <p>{{ content.description }}</p>
    <ul class="benefits">
      <li
        v-for="(benefit, i) in content.benefits"
        :key="i"
      >
        <i
          class="icon icon-checkmark"
          aria-hidden="true"
        />
        <span class="benefit">
          {{ benefit.text }}
          <a
            v-if="benefit.link"
            :href="benefit.link.link"
            target="_blank"
            rel="noopener noreferrer nofollow"
            :data-testid="`release-welcome-benefit-link-${ i }`"
          >
            {{ benefit.link.action }}
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
      size="small"
      :href="content.cta.link"
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-testid="release-welcome-registration-open"
    >
      {{ content.cta.action }}
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
    font-weight: 500;
  }
}

.cta {
  margin-top: 4px;
  font-weight: 600;
}
</style>
