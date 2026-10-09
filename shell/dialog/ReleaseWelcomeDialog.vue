<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import BrandImage from '@shell/components/BrandImage.vue';
import PrimePromoCard from '@shell/components/ReleaseWelcome/PrimePromoCard.vue';
import PrimeRegistrationCard from '@shell/components/ReleaseWelcome/PrimeRegistrationCard.vue';
import WhatsNewCard from '@shell/components/ReleaseWelcome/WhatsNewCard.vue';
import { useI18n } from '@shell/composables/useI18n';
import { REGISTRATION_ROUTE } from '@shell/config/release-welcome';
import { getVendor } from '@shell/config/private-label';
import { isRancherPrime } from '@shell/config/version';
import { SCC } from '@shell/store/features';
import { isAdminUser } from '@shell/store/type-map';
import { releaseWelcomeVersion } from '@shell/utils/release-welcome';
import { FirstRunFeature, FirstRunPrimePromo } from '@shell/utils/dynamic-content/types';

defineProps({
  componentTestid: {
    type:    String,
    default: 'release-welcome'
  },

  /**
   * "What's new" features from dynamic content, the built-in features are shown when not set
   */
  features: {
    type:    Array as PropType<FirstRunFeature[]>,
    default: undefined
  },

  /**
   * Prime promotion from dynamic content, the built-in promotion is shown when not set
   */
  primePromo: {
    type:    Object as PropType<FirstRunPrimePromo>,
    default: undefined
  },

  // Passed by the ModalManager
  resources: {
    type:    Array,
    default: () => []
  },

  registerBackgroundClosing: {
    type:    Function,
    default: () => {}
  }
});

const emit = defineEmits<{(e: 'close'): void }>();

const store = useStore();
const { t } = useI18n(store);

const vendor = getVendor();
const version = releaseWelcomeVersion() || '';
const isPrime = isRancherPrime();

// Same access as the registration page added by the rancher-prime extension
const canRegister = computed(() => isPrime && isAdminUser(store.getters) && !!store.getters['features/get'](SCC));

const close = () => emit('close');
</script>

<template>
  <div
    class="release-welcome"
    data-testid="release-welcome"
  >
    <header class="release-welcome__header">
      <BrandImage
        class="release-welcome__logo"
        file-name="rancher-logo.svg"
        :alt="t('releaseWelcome.logo', { vendor })"
      />
      <RcButton
        variant="ghost"
        :aria-label="t('releaseWelcome.close')"
        data-testid="release-welcome-close"
        @click="close"
      >
        <i
          class="icon icon-close"
          aria-hidden="true"
        />
      </RcButton>
    </header>

    <div class="release-welcome__body">
      <!-- AppModal names the dialog after the element with data-modal-title -->
      <h2
        class="release-welcome__title"
        data-modal-title
      >
        {{ isPrime ? t('releaseWelcome.titlePrime', { vendor }) : t('releaseWelcome.titleCommunity', { vendor }) }}
      </h2>
      <p
        v-if="isPrime"
        class="release-welcome__subtitle"
        data-testid="release-welcome-subtitle"
      >
        {{ t('releaseWelcome.subtitlePrime', { vendor, version }) }}
        <template v-if="canRegister">
          {{ t('releaseWelcome.registerLead') }}
          <router-link
            :to="REGISTRATION_ROUTE"
            data-testid="release-welcome-registration-page"
            @click="close"
          >
            {{ t('releaseWelcome.registrationPage') }}
          </router-link>.
        </template>
      </p>
      <p
        v-else
        class="release-welcome__subtitle"
        data-testid="release-welcome-subtitle"
      >
        {{ t('releaseWelcome.subtitleCommunity', { vendor, version }, true) }}
      </p>

      <WhatsNewCard
        :version="version"
        :features="features"
      />
      <PrimeRegistrationCard v-if="canRegister" />
      <PrimePromoCard
        v-else-if="!isPrime"
        :promo="primePromo"
      />
    </div>

    <footer class="release-welcome__footer">
      <span class="release-welcome__hint">{{ t('releaseWelcome.reopenHint') }}</span>
      <RcButton
        variant="primary"
        data-testid="release-welcome-go-to-dashboard"
        @click="close"
      >
        {{ t('releaseWelcome.goToDashboard') }}
      </RcButton>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.release-welcome {
  display: flex;
  flex-direction: column;
  background: var(--body-bg);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 32px 21px;
    border-bottom: 1px solid var(--border);
  }

  &__logo {
    height: 28px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 28px 32px 0;
  }

  &__title {
    margin: 0;
    font-family: var(--title-font-family, inherit);
    font-size: 20px;
    font-weight: 500;
    line-height: 30px;
  }

  &__subtitle {
    margin: 0;
    font-size: 16px;
    line-height: 26px;
    color: var(--muted);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 40px 32px 28px;
  }

  &__hint {
    font-size: 12px;
    color: var(--muted);
  }
}
</style>
