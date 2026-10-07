<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { WHATS_NEW_FEATURES } from '@shell/config/release-welcome';

defineProps({
  /**
   * Minor version of the release, e.g. '2.16'
   */
  version: {
    type:     String,
    required: true
  }
});

const store = useStore();
const { t } = useI18n(store);

const releaseNotesUrl = store.getters['releaseNotesUrl'];
</script>

<template>
  <section
    v-if="WHATS_NEW_FEATURES.length"
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
        <span
          class="whats-new__version"
          data-testid="release-welcome-version"
        >{{ t('releaseWelcome.whatsNew.version', { version }) }}</span>
      </h3>
      <a
        :href="releaseNotesUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        data-testid="release-welcome-release-notes"
      >
        {{ t('releaseWelcome.whatsNew.releaseNotes') }}
        <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
      </a>
    </div>
    <ul class="whats-new__features">
      <li
        v-for="feature in WHATS_NEW_FEATURES"
        :key="feature.id"
        :data-testid="`release-welcome-feature-${ feature.id }`"
      >
        <span class="whats-new__feature-title">{{ t(feature.titleKey, {}, true) }}</span>
        <span class="whats-new__feature-description">{{ t(feature.descriptionKey, {}, true) }}</span>
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

  &__version {
    padding: 3px 10px;
    border-radius: 100px;
    background: var(--info-banner-bg);
    color: var(--info);
    font-size: 12px;
    font-weight: 500;
    line-height: normal;
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
