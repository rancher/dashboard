<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { useI18n } from '@shell/composables/useI18n';

// The select treats an empty value as "nothing selected", so None needs a value of its own
const NONE = 'none';

const props = defineProps<{
  settingValue?: string;
  rules?: Array<(value: unknown) => string | undefined>;
}>();

const emit = defineEmits(['update:settingValue']);

const { t } = useI18n(useStore());

const options = [
  { label: t('advancedSettings.edit.trueOption'), value: 'true' },
  { label: t('advancedSettings.edit.falseOption'), value: 'false' },
  { label: t('advancedSettings.none'), value: NONE },
];

const selected = computed({
  get: () => props.settingValue || NONE,
  set: (neu: string) => emit('update:settingValue', neu === NONE ? '' : neu),
});
</script>

<template>
  <LabeledSelect
    v-model:value="selected"
    data-testid="input-setting-ui-appco-enabled"
    :label="t('advancedSettings.edit.value')"
    :options="options"
    :rules="rules"
    :searchable="false"
  />
</template>
