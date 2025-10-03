<script setup lang="ts">
import {
  ref, watch, onMounted, onBeforeUnmount, nextTick
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import AppModal from '@shell/components/AppModal.vue';
import CronExpressionEditor from './CronExpressionEditor.vue';

const props = defineProps<{
  /**
   * Initial cron expression string.
   */
  cronExpression?: string;
  /**
   * Controls whether the cron editor modal is visible.
   */
  show: boolean;
}>();

// eslint-disable-next-line
const emit = defineEmits<{
  (e: 'update:cronExpression', value: string): void;
  (e: 'update:show', value: boolean): void;
  (e: 'update:readableCron', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const localCron = ref(props.cronExpression ?? '* * * * *');
const localShow = ref(props.show);
const readableCron = ref('');
const isCronValid = ref(true);

const cronInfoRef = ref<HTMLElement | null>(null);
const modalBodyRef = ref<HTMLElement | null>(null);
const modalWidth = ref('600px');

const wildcards = [
  { symbol: '*', desc: 'component.cron.expressionEditorModal.wildcards.anyValue' },
  { symbol: 'X,Y', desc: 'component.cron.expressionEditorModal.wildcards.xAndY' },
  { symbol: 'X-Y', desc: 'component.cron.expressionEditorModal.wildcards.fromXtoY' },
  { symbol: '*/X', desc: 'component.cron.expressionEditorModal.wildcards.everyX' },
  { symbol: 'Y/X', desc: 'component.cron.expressionEditorModal.wildcards.everyXStartingY' },
  { symbol: 'Y-Z/X', desc: 'component.cron.expressionEditorModal.wildcards.everyXFromYtoZ' },
];

const examples = [
  { cron: '0 0 * * *', desc: 'component.cron.expressionEditorModal.examples.dailyMidnight' },
  { cron: '0 */5 * * *', desc: 'component.cron.expressionEditorModal.examples.every5Hours' },
  { cron: '45 17 1 * *', desc: 'component.cron.expressionEditorModal.examples.day1At1745' },
  { cron: '30 8/1 * * 1-5', desc: 'component.cron.expressionEditorModal.examples.weekdaysAt0830' },
  { cron: '0 */1 * 3,4,5 *', desc: 'component.cron.expressionEditorModal.examples.marchToMayHourly' },
  { cron: '0 9-17/4 * * *', desc: 'component.cron.expressionEditorModal.examples.every4Hours9to17' },
];

const closeModal = () => emit('update:show', false);
const confirmCron = () => {
  if (!isCronValid.value) return;
  emit('update:cronExpression', localCron.value);
  emit('update:readableCron', readableCron.value);
  closeModal();
};

// dynamically update modal width based on content
const updateWidth = () => {
  if (!modalBodyRef.value || !cronInfoRef.value) return;

  const bodyStyle = getComputedStyle(modalBodyRef.value);
  const padding = parseFloat(bodyStyle.paddingLeft) + parseFloat(bodyStyle.paddingRight);
  const extraBuffer = 10;
  const contentWidth = cronInfoRef.value.scrollWidth + padding + extraBuffer;

  // limit width to 90% of viewport
  modalWidth.value = `${ Math.min(contentWidth, window.innerWidth * 0.9) }px`;
};

watch(() => props.cronExpression, (val) => {
  if (val !== undefined) localCron.value = val;
});
watch(() => props.show, (val) => {
  localShow.value = val;

  if (val) {
    // reset cron to prop when modal opens
    localCron.value = props.cronExpression ?? '* * * * *';
    nextTick(updateWidth);
  }
});

onMounted(() => {
  nextTick(updateWidth);
  window.addEventListener('resize', updateWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth);
});
</script>

<template>
  <AppModal
    v-if="localShow"
    :width="modalWidth"
    name="cron-editor-modal"
    custom-class="cron-editor-modal"
    aria-labelledby="cron-editor-title"
    aria-describedby="cron-editor-desc"
    trigger-focus-trap
    @close="closeModal"
  >
    <div
      ref="modalBodyRef"
      class="modal-body"
    >
      <h4 id="cron-editor-title">
        {{ t('component.cron.expressionEditorModal.title') }}
      </h4>
      <p
        id="cron-editor-desc"
        class="description"
      >
        {{ t('component.cron.expressionEditorModal.description') }}
      </p>

      <div
        class="readableCron"
        aria-live="polite"
      >
        {{ readableCron }}
      </div>

      <CronExpressionEditor
        v-model:cron-expression="localCron"
        v-model:readable-cron="readableCron"
        v-model:is-valid="isCronValid"
        class="custom-cron-editor"
      />

      <div
        ref="cronInfoRef"
        class="cron-info"
      >
        <div class="cron-wildcards">
          <h5>{{ t('component.cron.expressionEditorModal.wildcards.title') }}</h5>
          <ul>
            <li
              v-for="(item, idx) in wildcards"
              :key="idx"
            >
              <span class="symbol">{{ item.symbol }}</span>
              <span class="desc">{{ t(item.desc) }}</span>
            </li>
          </ul>
        </div>

        <div class="cron-examples">
          <h5>{{ t('component.cron.expressionEditorModal.examples.title') }}</h5>
          <ul>
            <li
              v-for="(ex, idx) in examples"
              :key="idx"
            >
              <span class="symbol">{{ ex.cron }}</span>
              <span class="desc">{{ t(ex.desc) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button
        class="btn btn-sm role-secondary"
        @click="closeModal"
      >
        {{ t('generic.cancel') }}
      </button>
      <button
        class="btn btn-sm role-primary ml-10"
        :disabled="!isCronValid"
        @click="confirmCron"
      >
        {{ t('generic.confirm') }}
      </button>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
:global(#modals .cron-editor-modal) {
  border-radius: var(--border-radius-lg);
}

.modal-body {
  padding: 20px 20px 8px;

  .description {
    margin: 16px 0;
  }

  .readableCron {
    padding: 16px;
    background-color: var(--disabled-banner-bg);
  }

  .custom-cron-editor {
    margin: 64px auto;
    max-width: 600px;
  }

  .cron-info {
    display: flex;
    gap: 52px;
    flex-wrap: nowrap;
    overflow-x: auto;

    ul {
      list-style: none;
      padding: 0;
      margin: 16px 0;
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 10px;

      li {
        display: contents;
        white-space: nowrap;
        color: var(--input-label);
        font-size: 12px;
      }

      .symbol {
        color: var(--body-text);
      }
    }
  }
}

.modal-footer {
  border-top: 1px solid var(--border);
  display: flex;
  padding: 10px 20px;
  justify-content: flex-end;
}
</style>
