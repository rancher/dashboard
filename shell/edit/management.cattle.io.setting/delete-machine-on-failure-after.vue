<script>
import UnitInput from '@shell/components/form/UnitInput';

export default {
  name:       'DeleteMachineOnFailureAfter',
  components: { UnitInput },
  props:      {
    settingValue: {
      type:     String,
      required: true,
    },
    defaultValue: {
      type:    String,
      default: '0s',
    },
    rules: {
      type:    Array,
      default: () => [],
    },
  },
  computed: {
    value: {
      get() {
        return this.settingValue;
      },
      set(value) {
        this.$emit('update:setting-value', value);
      },
    },
  },
};
</script>

<template>
  <UnitInput
    v-model:value="value"
    data-testid="input-setting-delete-machine"
    :label="t('advancedSettings.edit.value')"
    suffix="s"
    :input-exponent="0"
    :increment="1"
    output-as="string"
    :output-modifier="true"
    :rules="rules"
  />
</template>
