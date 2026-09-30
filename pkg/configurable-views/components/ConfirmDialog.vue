<script setup lang="ts">
/**
 * The question useConfirm asks, opened through the shell's modal API and laid out like the shell's
 * own dialogs (see RedeployWorkloadDialog): a Card with the title, the question, then Cancel on the
 * left and the action on the right
 */
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { Card } from '@components/Card';
import { useI18n } from '@shell/composables/useI18n';

const props = defineProps<{
  title: string;
  body: string;
  action: string;
  danger?: boolean;
  /** Answers the question: true for the action, false for anything else. */
  settle(ok: boolean): void;
  /** From the modal manager: called when the modal closes without an answer (Esc, the backdrop). */
  registerBackgroundClosing?(fn: () => void): void;
}>();

const emit = defineEmits<{ close: [] }>();

const store = useStore();
const { t } = useI18n(store);

onMounted(() => props.registerBackgroundClosing?.(() => props.settle(false)));

function answer(ok: boolean): void {
  props.settle(ok);
  emit('close');
}
</script>

<template>
  <Card
    role="alertdialog"
    aria-modal="true"
    class="configurable-views-confirm"
    :show-highlight-border="false"
  >
    <!-- The modal manager puts its own test id on the root, so this one is on the title -->
    <template #title>
      <h4
        class="text-default-text"
        data-testid="configurable-views-confirm"
      >
        {{ title }}
      </h4>
    </template>

    <template #body>
      <div class="mb-10">
        {{ body }}
      </div>
    </template>

    <template #actions>
      <button
        role="button"
        class="btn role-secondary"
        data-testid="configurable-views-confirm-cancel"
        @click="answer(false)"
      >
        {{ t('generic.cancel') }}
      </button>
      <div class="spacer" />
      <button
        role="button"
        class="btn ml-10"
        :class="danger ? 'bg-error' : 'role-primary'"
        data-testid="configurable-views-confirm-action"
        @click="answer(true)"
      >
        {{ action }}
      </button>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.configurable-views-confirm {
  &.card-container {
    box-shadow: none;
  }

  .spacer {
    flex: 1;
  }
}
</style>
