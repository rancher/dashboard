<script setup lang="ts">
import {
  reactive, computed, watch, ref, nextTick
} from 'vue';
import { useStore } from 'vuex';
import { isValidCron } from 'cron-validator';
import cronstrue from 'cronstrue';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';
import { useI18n } from '@shell/composables/useI18n';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import CronTooltip from './CronTooltip.vue';
import type { TooltipSection, CronField } from './types';
import { cronFields } from './types';

const props = defineProps<{
  /**
   * Initial cron expression string.
   */
  cronExpression?: string;
}>();

// eslint-disable-next-line
const emit = defineEmits<{
  (e: 'update:isValid', value: boolean): void;
  (e: 'update:readableCron', value: string): void;
  (e: 'update:cronExpression', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);
const fields: CronField[] = cronFields;

const fieldLabels: Record<CronField, string> = {
  minute:     'component.cron.expressionEditor.label.minute',
  hour:       'component.cron.expressionEditor.label.hour',
  dayOfMonth: 'component.cron.expressionEditor.label.dayOfMonth',
  month:      'component.cron.expressionEditor.label.month',
  dayOfWeek:  'component.cron.expressionEditor.label.dayOfWeek',
};

function makeFieldRecord<T>(value: T): Record<CronField, T> {
  return cronFields.reduce((acc, f) => {
    acc[f] = value;

    return acc;
  }, {} as Record<CronField, T>);
}

function parseCronToFields(expr: string): Record<CronField, string> {
  const parts = expr?.trim().split(' ') || [];
  const record = makeFieldRecord('');

  fields.forEach((f, idx) => {
    record[f] = parts[idx] || '';
  });

  return record;
}

const cronValues = reactive<Record<CronField, string>>(parseCronToFields(props.cronExpression || '* * * * *'));
const errors = reactive<Record<CronField, boolean>>(makeFieldRecord(false));
const focusedField = reactive<Record<CronField, boolean>>(makeFieldRecord(false));
const rootRef = ref<HTMLElement | null>(null);
const wrapperRefs: Record<CronField, HTMLElement | null> = makeFieldRecord(null);
const tooltipRefs: Record<CronField, HTMLElement | null> = makeFieldRecord(null);
const popperInstances: Record<CronField, PopperInstance | null> = makeFieldRecord(null);

const tooltipData: Record<CronField, TooltipSection[]> = {
  minute: [
    {
      type:  'rules',
      items: [
        { value: '*', descKey: 'component.cron.expressionEditor.minute.any' },
        { value: '1,5', descKey: 'component.cron.expressionEditor.minute.at1and5' },
        { value: '1-5', descKey: 'component.cron.expressionEditor.minute.range' },
        { value: '*/5', descKey: 'component.cron.expressionEditor.minute.every5' },
        { value: '8/5', descKey: 'component.cron.expressionEditor.minute.start8' },
      ]
    },
    {
      type:  'explanation',
      items: [
        { descKey: 'component.cron.expressionEditor.minute.allowed' },
      ]
    }
  ],
  hour: [
    {
      type:  'rules',
      items: [
        { value: '*', descKey: 'component.cron.expressionEditor.hour.any' },
        { value: '1,5', descKey: 'component.cron.expressionEditor.hour.at1and5' },
        { value: '1-5', descKey: 'component.cron.expressionEditor.hour.range' },
        { value: '*/5', descKey: 'component.cron.expressionEditor.hour.every5' },
        { value: '8/5', descKey: 'component.cron.expressionEditor.hour.start8' },
      ]
    },
    {
      type:  'explanation',
      items: [
        { descKey: 'component.cron.expressionEditor.hour.allowed' },
      ]
    }
  ],
  dayOfMonth: [
    {
      type:  'rules',
      items: [
        { value: '*', descKey: 'component.cron.expressionEditor.dayOfMonth.any' },
        { value: '?', descKey: 'component.cron.expressionEditor.dayOfMonth.omit' },
        { value: '1,5', descKey: 'component.cron.expressionEditor.dayOfMonth.1and5' },
        { value: '1-5', descKey: 'component.cron.expressionEditor.dayOfMonth.range' },
        { value: '*/5', descKey: 'component.cron.expressionEditor.dayOfMonth.every5' },
        { value: '8/5', descKey: 'component.cron.expressionEditor.dayOfMonth.start8' },
      ]
    },
    {
      type:  'explanation',
      items: [
        { descKey: 'component.cron.expressionEditor.dayOfMonth.allowed' },
      ]
    }
  ],
  month: [
    {
      type:  'rules',
      items: [
        { value: '*', descKey: 'component.cron.expressionEditor.month.any' },
        { value: '1,5', descKey: 'component.cron.expressionEditor.month.1and5' },
        { value: '1-5', descKey: 'component.cron.expressionEditor.month.range' },
        { value: '*/2', descKey: 'component.cron.expressionEditor.month.every2' },
        { value: '3/2', descKey: 'component.cron.expressionEditor.month.start3' },
      ]
    },
    {
      type:  'explanation',
      items: [
        { descKey: 'component.cron.expressionEditor.month.allowed' },
        { descKey: 'component.cron.expressionEditor.month.alias' },
      ]
    }
  ],
  dayOfWeek: [
    {
      type:  'rules',
      items: [
        { value: '*', descKey: 'component.cron.expressionEditor.dayOfWeek.any' },
        { value: '?', descKey: 'component.cron.expressionEditor.dayOfWeek.omit' },
        { value: '1,5', descKey: 'component.cron.expressionEditor.dayOfWeek.1and5' },
        { value: '1-5', descKey: 'component.cron.expressionEditor.dayOfWeek.range' },
      ]
    },
    {
      type:  'explanation',
      items: [
        { descKey: 'component.cron.expressionEditor.dayOfWeek.allowed' },
        { descKey: 'component.cron.expressionEditor.dayOfWeek.alias' },
      ]
    }
  ],
};

const validateField = (field: CronField, value: string) => {
  if (!value) {
    errors[field] = true;

    return;
  }

  const exprMap: Record<CronField, string> = {
    minute:     `${ value } * * * *`,
    hour:       `* ${ value } * * *`,
    dayOfMonth: `* * ${ value } * *`,
    month:      `* * * ${ value } *`,
    dayOfWeek:  `* * * * ${ value }`,
  };

  errors[field] = !isValidCron(exprMap[field], {
    alias:              true,
    allowBlankDay:      true,
    allowSevenAsSunday: true,
  });
};

fields.forEach((f) => validateField(f, cronValues[f]));

const isValid = computed(() => !Object.values(errors).some(Boolean));
const expression = computed(() => fields.map((f) => cronValues[f]).join(' '));
const readableCron = computed(() => {
  if (!isValid.value) return t('component.cron.expressionEditor.invalidCronExpression');
  try {
    return cronstrue.toString(expression.value);
  } catch {
    return t('component.cron.expressionEditor.invalidCronExpression');
  }
});

watch(cronValues, () => {
  emit('update:cronExpression', expression.value);
  emit('update:readableCron', readableCron.value);
  emit('update:isValid', isValid.value);
}, { deep: true, immediate: true });

const handleInput = (field: CronField, val: string) => {
  cronValues[field] = val;
  validateField(field, val);
};

const handleFocus = async(field: CronField) => {
  focusedField[field] = true;
  await nextTick();
  if (wrapperRefs[field] && tooltipRefs[field]) {
    popperInstances[field] = createPopper(wrapperRefs[field], tooltipRefs[field], {
      placement: 'bottom-start',
      modifiers: [
        { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end'] } },
        { name: 'preventOverflow', options: { boundary: rootRef.value || document.body, padding: 4 } },
        { name: 'offset', options: { offset: [0, 4] } },
      ],
    });
  }
};

const handleBlur = (field: CronField) => {
  focusedField[field] = false;
  popperInstances[field]?.destroy();
  popperInstances[field] = null;
};
</script>

<template>
  <div
    ref="rootRef"
    class="cron-edit"
    v-bind="$attrs"
  >
    <div class="cron-row">
      <div
        v-for="field in fields"
        :key="field"
        :ref="el => wrapperRefs[field] = el as HTMLElement"
        class="input-wrapper"
      >
        <LabeledInput
          :label="t(fieldLabels[field])"
          :value="cronValues[field]"
          :status="errors[field] ? 'error' : undefined"
          :tooltip="errors[field] ? t('component.cron.expressionEditor.invalidValue') : ''"
          :aria-invalid="!!errors[field]"
          :aria-label="t('component.cron.expressionEditor.a11y.examples', { label: t(fieldLabels[field]) })"
          :aria-describedby="`tooltip-${field}`"
          @update:value="val => handleInput(field, val)"
          @focus="() => handleFocus(field)"
          @blur="() => handleBlur(field)"
        />
        <div
          v-show="focusedField[field]"
          :id="`tooltip-${field}`"
          :ref="el => tooltipRefs[field] = el as HTMLElement"
          role="tooltip"
          class="cron-tooltip-wrapper"
        >
          <CronTooltip :sections="tooltipData[field]" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$input-max-width: 110px;

.cron-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.input-wrapper {
  max-width: $input-max-width;
  flex: 1 1 auto;

  .label {
    color: var(--label-secondary);
    font-size: 12px;
  }
}

.cron-tooltip-wrapper {
  padding: 16px;
  background: var(--body-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 8px var(--shadow);
  display: inline-block;
  z-index: 2;
}
</style>
