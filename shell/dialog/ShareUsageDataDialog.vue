<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { Card } from '@components/Card';
import { RadioGroup } from '@components/Form/Radio';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import { SHARE_USAGE_DATA } from '@shell/store/prefs';
import { SHARE_USAGE_DATA_OPTIONS } from '@shell/utils/share-usage-data';

const PRIVACY_POLICY_URL = 'https://www.suse.com/company/policies/privacy/';

defineProps({
  componentTestid: {
    type:    String,
    default: 'share-usage-data'
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

const options = computed(() => [
  {
    value:       SHARE_USAGE_DATA_OPTIONS.SHARE,
    label:       t('shareUsageData.options.share.label'),
    description: t('shareUsageData.options.share.description', {}, true),
  },
  {
    value:       SHARE_USAGE_DATA_OPTIONS.DONT_SHARE,
    label:       t('shareUsageData.options.dontShare.label'),
    description: t('shareUsageData.options.dontShare.description', {}, true),
  },
]);

const collected = ['featureUsage', 'resourceCounts', 'crashTraces', 'performance'];
const neverCollected = ['workloadNames', 'secrets', 'personalInfo', 'network'];

// Not '', RadioGroup would cast an empty string to `true` for its Boolean value prop
const choice = ref<string | undefined>(undefined);
const detailsOpen = ref(true);
const saving = ref(false);

const confirm = async() => {
  if (!choice.value) {
    return;
  }

  saving.value = true;

  try {
    await store.dispatch('prefs/set', { key: SHARE_USAGE_DATA, value: choice.value });
    emit('close');
  } catch (err) {
    store.dispatch('growl/fromError', { title: t('shareUsageData.title', {}, true), err });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Card
    class="share-usage-data"
    :show-highlight-border="false"
    :data-testid="componentTestid"
  >
    <template #title>
      <h3 class="share-usage-data__title">
        {{ t('shareUsageData.title', {}, true) }}
      </h3>
    </template>
    <template #body>
      <div class="share-usage-data__body">
        <p class="share-usage-data__description">
          {{ t('shareUsageData.description', {}, true) }}
        </p>

        <RadioGroup
          v-model:value="choice"
          name="share-usage-data"
          class="share-usage-data__options"
          :options="options"
          :row="true"
          :use-body-text-color="true"
          :aria-label="t('shareUsageData.options.ariaLabel', {}, true)"
          :data-testid="`${ componentTestid }-options`"
        />

        <div class="share-usage-data__details">
          <button
            type="button"
            class="share-usage-data__details-toggle"
            :aria-expanded="detailsOpen"
            aria-controls="share-usage-data-details"
            :data-testid="`${ componentTestid }-details-toggle`"
            @click="detailsOpen = !detailsOpen"
          >
            {{ t('shareUsageData.details.title', {}, true) }}
            <i
              class="icon"
              :class="detailsOpen ? 'icon-chevron-up' : 'icon-chevron-down'"
              aria-hidden="true"
            />
          </button>
          <div
            v-show="detailsOpen"
            id="share-usage-data-details"
            class="share-usage-data__details-body"
            :data-testid="`${ componentTestid }-details`"
          >
            <div class="share-usage-data__columns">
              <div>
                <h4>{{ t('shareUsageData.details.collected.title', {}, true) }}</h4>
                <ul>
                  <li
                    v-for="item in collected"
                    :key="item"
                  >
                    {{ t(`shareUsageData.details.collected.${ item }`, {}, true) }}
                  </li>
                </ul>
              </div>
              <div>
                <h4 class="share-usage-data__never">
                  {{ t('shareUsageData.details.neverCollected.title', {}, true) }}
                </h4>
                <ul>
                  <li
                    v-for="item in neverCollected"
                    :key="item"
                  >
                    {{ t(`shareUsageData.details.neverCollected.${ item }`, {}, true) }}
                  </li>
                </ul>
              </div>
            </div>
            <p>{{ t('shareUsageData.details.transport', {}, true) }}</p>
            <p>
              {{ t('shareUsageData.details.privacyPrefix', {}, true) }}
              <a
                :href="PRIVACY_POLICY_URL"
                target="_blank"
                rel="noopener noreferrer nofollow"
                :data-testid="`${ componentTestid }-privacy`"
              >
                {{ t('shareUsageData.details.privacyLink', {}, true) }}
                <i
                  class="icon icon-external-link"
                  aria-hidden="true"
                />
                <span class="sr-only">{{ t('shareUsageData.details.newTab', {}, true) }}</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </template>
    <template #actions>
      <div class="share-usage-data__actions">
        <span
          v-if="!choice"
          id="share-usage-data-required"
          class="share-usage-data__required"
        >
          {{ t('shareUsageData.required', {}, true) }}
        </span>
        <RcButton
          variant="primary"
          size="large"
          class="share-usage-data__confirm"
          :disabled="!choice || saving"
          :aria-describedby="choice ? undefined : 'share-usage-data-required'"
          :data-testid="`${ componentTestid }-confirm`"
          @click="confirm"
        >
          {{ t('shareUsageData.confirm', {}, true) }}
        </RcButton>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.share-usage-data {
  &.card-container {
    box-shadow: none;
    margin: 0;
    padding: 24px;
  }

  :deep(.card-wrap > hr) {
    display: none;
  }

  :deep(.card-body) {
    margin-top: 16px;
    color: var(--body-text);
  }

  :deep(.card-actions) {
    padding-top: 40px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--body-text);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__description {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--muted);
  }

  // Each option is a bordered card, the whole card selects it
  &__options {
    :deep(.radio-group.row) {
      gap: 16px;

      // The global .row clearfix would add empty flex items, each taking a gap
      &::before,
      &::after {
        display: none;
      }

      > div {
        display: flex;
        flex: 1;
      }
    }

    :deep(.radio-group.row .radio-container) {
      flex: 1;
      margin: 0;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;

      &.radio-button-checked {
        // Keep the size when the border gets thicker
        padding: 13px 15px;
        border: 2px solid var(--primary);
      }
    }

    :deep(.radio-label) {
      font-weight: 600;
    }

    :deep(.radio-button-outer-container-description) {
      margin-top: 6px;
      font-size: 13px;
      color: var(--muted);
    }
  }

  &__details {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  &__details-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 0;
    padding: 12px 16px;
    border-radius: 0;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    line-height: normal;
    color: var(--body-text);

    &:hover {
      color: var(--body-text);
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: -2px;
    }

    .icon {
      font-size: 12px;
      color: var(--muted);
    }
  }

  &__details-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 2px 16px 14px;
    font-size: 12px;
    color: var(--muted);

    p {
      margin: 0;
    }

    a .icon {
      font-size: 12px;
    }
  }

  &__columns {
    display: flex;
    gap: 24px;

    > div {
      flex: 1;
    }

    h4 {
      margin: 0 0 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--body-text);
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 13px;
      line-height: 22px;
    }
  }

  &__never.share-usage-data__never {
    color: var(--success);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  &__required {
    font-size: 13px;
    color: var(--muted);
  }

  &__confirm {
    margin-left: auto;
  }
}
</style>
