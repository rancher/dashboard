<script setup lang="ts">
/**
 * The question useConfirm asks, opened through the shell's modal API and laid out like the shell's
 * own prompts (see GenericPrompt): a Card with the title, the question, then Cancel and the action
 * together on the right
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
      <div class="configurable-views-confirm__bottom">
        <div class="configurable-views-confirm__buttons">
          <button
            role="button"
            class="btn role-secondary mr-10"
            data-testid="configurable-views-confirm-cancel"
            @click="answer(false)"
          >
            {{ t('generic.cancel') }}
          </button>
          <button
            role="button"
            class="btn"
            :class="danger ? 'bg-error' : 'role-primary'"
            data-testid="configurable-views-confirm-action"
            @click="answer(true)"
          >
            {{ action }}
          </button>
        </div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.configurable-views-confirm {
  &.card-container {
    box-shadow: none;
  }

  // As GenericPrompt: the actions fill the row and sit at its right end
  &__bottom {
    display:        flex;
    flex:           1;
    flex-direction: column;
  }

  &__buttons {
    display:         flex;
    justify-content: flex-end;
    width:           100%;
  }
}
</style>
