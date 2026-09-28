<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  name:       'DeleteMachineOnFailureAfter',
  components: { LabeledInput },
  emits:      ['update:setting-value'],
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
    displayValue() {
      // Remove the 's' suffix for display if present
      const val = this.settingValue || this.defaultValue;

      return val?.endsWith('s') ? val.slice(0, -1) : val;
    },
  },
  methods: {
    updateValue(event) {
      const inputValue = event.target?.value || event;
      // Ensure the value always has the 's' suffix
      const newValue = inputValue ? `${ inputValue }s` : '0s';

      this.$emit('update:setting-value', newValue);
    },
  },
};
</script>

<template>
  <LabeledInput
    :value="displayValue"
    data-testid="input-setting-delete-machine"
    :label="t('advancedSettings.edit.value')"
    type="number"
    :min="0"
    :rules="rules"
    @update:value="updateValue"
    @blur="updateValue"
  >
    <template #suffix>
      <div class="addon">
        s
      </div>
    </template>
  </LabeledInput>
</template>

<style lang="scss" scoped>
.addon {
  display: flex;
  align-items: center;
  padding: 0 10px;
}
</style>
