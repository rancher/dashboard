<script setup lang="ts">
/**
 * Asks before a view is published for everyone, saying what its filter gives away when it has one
 */
import { useStore } from 'vuex';

import { RcButton } from '@components/RcButton';
import { RcModal } from '@components/RcModal';
import { useI18n } from '@shell/composables/useI18n';

const props = withDefaults(defineProps<{
  /** `show` and the close handler, from the table that opens it */
  modal: { show: boolean, onClose(): void },
  /** The view has a filter, whose names and values everyone will see */
  hasFilter?: boolean,
}>(), { hasFilter: false });

const emit = defineEmits<{
  publish: [],
}>();

const store = useStore();
const { t } = useI18n(store);

const publish = () => {
  emit('publish');
  props.modal.onClose();
};
</script>

<template>
  <RcModal
    v-bind="modal"
    :title="t('tableViews.publish.title')"
    data-testid="table-views-publish-modal"
  >
    <p>{{ t('tableViews.publish.body') }}</p>
    <p
      v-if="hasFilter"
      data-testid="table-views-publish-warning"
    >
      {{ t('tableViews.filterWarning', undefined, true) }}
    </p>

    <template #primary-action>
      <RcButton
        variant="primary"
        size="large"
        data-testid="table-views-publish-confirm"
        @click="publish"
      >
        {{ t('tableViews.tab.share') }}
      </RcButton>
    </template>
  </RcModal>
</template>
