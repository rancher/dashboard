<script setup lang="ts">
import {
  computed, nextTick, onMounted, onUnmounted, PropType, ref
} from 'vue';
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
import { markReleaseNotesRead } from '@shell/utils/release-notes';

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
const isPrime = isRancherPrime();
const badgeVersion = isPrime ? runningVersion() || minorVersion : minorVersion;

// Same access as the registration page added by the rancher-prime extension
const canRegister = computed(() => isPrime && isAdminUser(store.getters) && !!store.getters['features/get'](SCC));

// The vendor already names the edition, e.g. 'Rancher Community' or 'Rancher Prime'
const title = computed(() => t('releaseWelcome.title', { vendor }));

// A card shows next to "What's new": the registration card (Prime admins) or the Prime promotion (Community)
const hasSideCard = computed(() => canRegister.value || !isPrime);

// The modal opens straight away, the cards fade in once the dynamic content is fetched (or not, then the built-in content)
const loading = ref(true);
const content = ref<FirstRunReleaseContent>({});

// The cards area grows or shrinks smoothly from the placeholders to the cards, instead of the modal jumping
const cards = ref<HTMLElement | null>(null);
const cardsHeight = ref('');

const showCards = async() => {
  const el = cards.value;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!el || reducedMotion) {
    loading.value = false;

    return;
  }

  cardsHeight.value = `${ el.offsetHeight }px`;
  loading.value = false;
  await nextTick();

  const target = `${ el.scrollHeight }px`;

  if (target === cardsHeight.value) {
    cardsHeight.value = '';

    return;
  }
  requestAnimationFrame(() => {
    cardsHeight.value = target;
  });
};

// Back to the natural height, so the cards can still reflow (e.g. on resize)
const onCardsTransitionEnd = (event: TransitionEvent) => {
  if (event.target === cards.value && event.propertyName === 'height') {
    cardsHeight.value = '';
  }
};

onMounted(async() => {
  if (minorVersion) {
    content.value = await fetchFirstRunContent(store.getters, (store as any).$axios, minorVersion);
  }
  await showCards();
});

onUnmounted(() => markReleaseNotesRead(store.dispatch, store.getters));

const close = () => props.modal.onClose();
</script>

<template>
  <RcModal
    v-bind="modal"
    size="large"
    class="release-welcome"
    data-testid="release-welcome"
  >
    <template #title>
      <h2 class="sr-only">
        {{ title }}
      </h2>
      <BrandImage
        class="release-welcome__logo"
        file-name="rancher-logo.svg"
        alt=""
      />
    </template>

    <p
      class="release-welcome__title"
      data-testid="release-welcome-title"
      aria-hidden="true"
    >
      {{ title }}
    </p>
    <p
      v-if="isPrime"
      class="release-welcome__subtitle"
      data-testid="release-welcome-subtitle"
    >
      {{ t('releaseWelcome.subtitlePrime', { vendor }) }}
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
      {{ t('releaseWelcome.subtitleCommunity', { vendor }, true) }}
    </p>

    <div
      ref="cards"
      class="release-welcome__cards"
      :class="{ 'release-welcome__cards--resizing': !!cardsHeight }"
      :style="cardsHeight ? { height: cardsHeight } : undefined"
      :aria-busy="loading"
      @transitionend="onCardsTransitionEnd"
    >
      <div
        v-if="loading"
        class="release-welcome__cards-content"
        data-testid="release-welcome-loading"
      >
        <span class="sr-only">{{ t('releaseWelcome.loading') }}</span>
        <div
          class="release-welcome__placeholder release-welcome__placeholder--whats-new"
          data-testid="release-welcome-loading-whats-new"
        >
          <i
            class="icon icon-spinner icon-spin icon-lg"
            aria-hidden="true"
          />
        </div>
        <div
          v-if="hasSideCard"
          class="release-welcome__placeholder release-welcome__placeholder--side"
          data-testid="release-welcome-loading-side"
        >
          <i
            class="icon icon-spinner icon-spin icon-lg"
            aria-hidden="true"
          />
        </div>
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
            :version="badgeVersion"
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
          data-testid="release-welcome-close"
          autofocus
          @click="close"
        >
          {{ t('releaseWelcome.close') }}
        </RcButton>
      </div>
    </template>
  </RcModal>
</template>

<style lang="scss" scoped>
.release-welcome {
  &__logo {
    display: block;
    height: 28px;
  }

  &__title {
    margin: 0;
    padding-top: 24px;
    border-top: 1px solid var(--border);
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
    transition: height 0.3s ease-in-out;

    &--resizing {
      overflow: hidden;
    }
  }

  // Average heights of the cards in the design, so the modal barely changes size when they arrive
  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-lg);
    color: var(--muted);

    &--whats-new {
      height: 272px;
    }

    &--side {
      height: 256px;
    }
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
  .release-welcome-fade-enter-active,
  .release-welcome__cards {
    transition: none;
  }
}
</style>
