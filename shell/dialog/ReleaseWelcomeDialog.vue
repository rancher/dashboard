<script setup lang="ts">
import { computed, onMounted, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { RcModal } from '@components/RcModal';
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
import { fetchFirstRunContent } from '@shell/utils/dynamic-content/first-run';
import { FirstRunReleaseContent } from '@shell/utils/dynamic-content/types';
import { releaseWelcomeVersion, runningVersion } from '@shell/utils/release-welcome';

const props = defineProps({
  /**
   * `show` and the `close` handler, from the ModalManager
   */
  modal: {
    type:     Object as PropType<{ show: boolean, onClose: () => void }>,
    required: true
  },

  // Passed by the ModalManager
  resources: {
    type:    Array,
    default: () => []
  }
});

const store = useStore();
const { t } = useI18n(store);

const vendor = getVendor();
const minorVersion = releaseWelcomeVersion() || '';
// The subtitle names the exact running version, e.g. 2.16.1
const version = runningVersion() || minorVersion;
const isPrime = isRancherPrime();

// Same access as the registration page added by the rancher-prime extension
const canRegister = computed(() => isPrime && isAdminUser(store.getters) && !!store.getters['features/get'](SCC));

// The vendor already names the edition, e.g. 'Rancher Community' or 'Rancher Prime'
const title = computed(() => t('releaseWelcome.title', { vendor }));

// The modal opens straight away, the cards fade in once the dynamic content is fetched (or not, then the built-in content)
const loading = ref(true);
const content = ref<FirstRunReleaseContent>({});

onMounted(async() => {
  if (minorVersion) {
    content.value = await fetchFirstRunContent(store.getters, (store as any).$axios, minorVersion);
  }
  loading.value = false;
});

const close = () => props.modal.onClose();
</script>

<template>
  <RcModal
    v-bind="modal"
    size="large"
    class="release-welcome"
    data-testid="release-welcome"
    :aria-label="title"
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

    <h2
      class="release-welcome__title"
      data-testid="release-welcome-title"
    >
      {{ title }}
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

    <div
      class="release-welcome__cards"
      :aria-busy="loading"
    >
      <div
        v-if="loading"
        class="release-welcome__loading"
        data-testid="release-welcome-loading"
      >
        <i
          class="icon icon-spinner icon-spin icon-lg"
          aria-hidden="true"
        />
        <span class="sr-only">{{ t('releaseWelcome.loading') }}</span>
      </div>
      <Transition
        name="release-welcome-fade"
        appear
      >
        <div
          v-if="!loading"
          class="release-welcome__cards-content"
        >
          <WhatsNewCard
            :version="minorVersion"
            :features="content.features"
          />
          <PrimeRegistrationCard
            v-if="canRegister"
            :registration="content.registration"
          />
          <PrimePromoCard
            v-else-if="!isPrime"
            :promo="content.primePromo"
          />
        </div>
      </Transition>
    </div>

    <template #actions>
      <div class="release-welcome__footer">
        <span class="release-welcome__hint">{{ t('releaseWelcome.reopenHint') }}</span>
        <RcButton
          variant="primary"
          data-testid="release-welcome-go-to-dashboard"
          @click="close"
        >
          {{ t('releaseWelcome.goToDashboard') }}
        </RcButton>
      </div>
    </template>
  </RcModal>
</template>

<style lang="scss" scoped>
.release-welcome {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  &__logo {
    height: 28px;
  }

  &__title {
    margin: 0;
    font-family: var(--title-font-family, inherit);
    font-size: 20px;
    font-weight: 500;
    line-height: 30px;
  }

  &__subtitle {
    margin: -12px 0 0;
    font-size: 16px;
    line-height: 26px;
    color: var(--muted);
  }

  &__cards {
    // Room for the spinner, so the modal doesn't jump from nothing to its full size
    min-height: 200px;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--muted);
  }

  &__cards-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__footer {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__hint {
    font-size: 12px;
    color: var(--muted);
  }
}

.release-welcome-fade-enter-active {
  transition: opacity 0.3s ease-in;
}

.release-welcome-fade-enter-from {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .release-welcome-fade-enter-active {
    transition: none;
  }
}
</style>
