<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useStore } from 'vuex';
import BrandImage from '@shell/components/BrandImage';
import { useI18n } from '@shell/composables/useI18n';
import { stringify } from '@shell/utils/error';

/**
 * Presentational 'fail whale' error content.
 *
 * Renders the error imagery, title and message. Any actions (Home, Reload, ...)
 * are supplied by the consumer via the `actions` slot, so the same content can be
 * used both as a full page (see `shell/pages/fail-whale.vue`) and in-context in
 * place of a resource list/detail (retaining the side menu and cluster context).
 */
interface Suggestion {
  label: string;
  url: string;
}

/**
 * Error shapes handled here: a plain `Error`, or an API error carrying an HTTP
 * `status`/`statusText` and/or a `data` payload used as the display message.
 * All fields are optional so a plain `Error` instance is also assignable.
 */
interface FailWhaleError {
  status?: number | string;
  statusText?: string;
  data?: string;
}

const props = defineProps({
  error: {
    type:    Object as PropType<FailWhaleError | null>,
    default: null,
  },

  /**
   * Optional 'did you mean ...?' suggestion, rendered as a link below the message.
   * Shape: `{ label, url }` where `url` is the resolved href to the suggested resource.
   */
  suggestion: {
    type:    Object as PropType<Suggestion | null>,
    default: null,
  },
});

const store = useStore();
const { t } = useI18n(store);

const displayError = computed(() => {
  return props.error?.data ? props.error.data : stringify(props.error);
});

// The link is part of the translated string (see `nav.failWhale.didYouMean`) so it can
// be positioned per locale, then rendered via `v-clean-html`
const suggestionHtml = computed(() => {
  if (!props.suggestion) {
    return null;
  }

  return t('nav.failWhale.didYouMean', { url: props.suggestion.url, resource: props.suggestion.label }, true);
});
</script>

<template>
  <div
    class="fail-whale error"
    data-testid="fail-whale"
  >
    <div class="text-center">
      <BrandImage
        file-name="error-desert-landscape.svg"
        width="900"
        height="300"
      />
      <h1 v-if="error && error.status">
        HTTP Error {{ error.status }}: {{ error.statusText }}
      </h1>
      <h1 v-else>
        Error
      </h1>
      <h2
        v-if="error"
        class="text-secondary mt-20"
      >
        {{ displayError }}
      </h2>
      <h2
        v-if="suggestionHtml"
        v-clean-html="suggestionHtml"
        class="text-secondary mt-20"
        data-testid="fail-whale-suggestion"
      />
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .fail-whale.error {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
    overflow: hidden;

    .row {
      align-items: center;
    }

    h1 {
      font-size: 5rem;
    }
  }
</style>
