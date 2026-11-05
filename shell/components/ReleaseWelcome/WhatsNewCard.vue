<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useStore } from 'vuex';
import { RcStatusBadge } from '@components/Pill';
import { useI18n } from '@shell/composables/useI18n';
import { WHATS_NEW_FEATURES } from '@shell/config/release-welcome';
import { FirstRunFeature } from '@shell/utils/dynamic-content/types';

const props = defineProps({
  /**
   * Version in the badge, e.g. '2.16', or '2.16.1' on Prime
   */
  version: {
    type:     String,
    required: true
  },

  /**
   * Features from dynamic content, the built-in features are shown when not set
   */
  features: {
    type:    Array as PropType<FirstRunFeature[]>,
    default: undefined
  }
});

const store = useStore();
const { t } = useI18n(store);

const releaseNotesUrl = store.getters['releaseNotesUrl'];

const items = computed<FirstRunFeature[]>(() => props.features || WHATS_NEW_FEATURES.map((feature) => ({
  id:          feature.id,
  title:       t(feature.titleKey, {}, true),
  description: t(feature.descriptionKey, {}, true),
})));
</script>

<template>
  <section
    v-if="items.length"
    class="whats-new"
    aria-labelledby="release-welcome-whats-new-title"
    data-testid="release-welcome-whats-new"
  >
    <div class="whats-new__header">
      <h3
        id="release-welcome-whats-new-title"
        class="whats-new__title"
      >
        {{ t('releaseWelcome.whatsNew.title', {}, true) }}
        <RcStatusBadge
          status="info"
          data-testid="release-welcome-version"
        >
          {{ t('releaseWelcome.whatsNew.version', { version }) }}
        </RcStatusBadge>
      </h3>
      <a
        :href="releaseNotesUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        data-testid="release-welcome-release-notes"
      >
        {{ t('releaseWelcome.whatsNew.releaseNotes') }}
        <i
          class="icon icon-external-link"
          aria-hidden="true"
        />
        <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
      </a>
    </div>
    <ul class="whats-new__features">
      <li
        v-for="feature in items"
        :key="feature.id"
        :data-testid="`release-welcome-feature-${ feature.id }`"
      >
        <span class="whats-new__feature-title">{{ feature.title }}</span>
        <span class="whats-new__feature-description">{{ feature.description }}</span>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.whats-new {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: var(--body-bg);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__features {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0 0 4px;
    list-style: none;
    font-size: 14px;
    line-height: 1.4;

    li {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }

  &__feature-title {
    font-weight: 600;
  }

  &__feature-description {
    color: var(--muted);
  }
}
</style>
