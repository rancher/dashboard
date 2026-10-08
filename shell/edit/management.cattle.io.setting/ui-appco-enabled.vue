<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import { useI18n } from '@shell/composables/useI18n';

// RadioGroup's value prop casts an empty string to `true`, so None needs a value of its own
const NONE = 'none';

const props = defineProps<{
  settingValue?: string;
  defaultValue?: string;
  rules?: Array<(value: unknown) => string | undefined>;
}>();

const emit = defineEmits(['update:settingValue']);

const { t } = useI18n(useStore());

const options = [
  {
    label: t('advancedSettings.edit.trueOption'), description: t('advancedSettings.edit.uiAppcoEnabled.true'), value: 'true'
  },
  {
    label: t('advancedSettings.edit.falseOption'), description: t('advancedSettings.edit.uiAppcoEnabled.false'), value: 'false'
  },
  {
    label: t('advancedSettings.edit.uiAppcoEnabled.noneLabel'), description: t('advancedSettings.edit.uiAppcoEnabled.none'), value: NONE
  },
];

const selected = computed({
  get: () => props.settingValue || NONE,
  set: (neu: string) => emit('update:settingValue', neu === NONE ? '' : neu),
});
</script>

<template>
  <RadioGroup
    v-model:value="selected"
    data-testid="input-setting-ui-appco-enabled"
    name="settings_value"
    :options="options"
  />
</template>
