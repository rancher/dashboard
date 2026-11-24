<script setup lang="ts">
import { _EDIT } from '@shell/config/query-params';
import { RadioButton, RadioGroup } from '@components/Form/Radio';
import { RcIconTooltip } from '@components/RcIconTooltip';
import { PermissionGroupOption, resolveUnlockedPermissionGroup } from '@shell/utils/membership-permissions';

export interface MemberPermissionOption extends PermissionGroupOption {
  label: string;
  description?: string;
  locked?: boolean;
  tooltip?: string;
}

const props = withDefaults(defineProps<{
  value?: string;
  options: MemberPermissionOption[];
  name?: string;
  mode?: string;
}>(), {
  value: '',
  name:  'permission-group',
  mode:  _EDIT,
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

function onUpdateValue(nextValue: string) {
  emit('update:value', resolveUnlockedPermissionGroup(nextValue, props.value, props.options));
}
</script>

<template>
  <RadioGroup
    :value="value"
    :mode="mode"
    data-testid="permission-options"
    :options="options"
    :name="name"
    @update:value="onUpdateValue"
  >
    <template
      v-for="(option, i) in options"
      :key="i"
      #[i]="{ option: normalizedOption, isDisabled }"
    >
      <RadioButton
        :value="value"
        :name="name"
        :mode="mode"
        :radio-option-id="normalizedOption.radioOptionId"
        :val="option.value"
        :label="option.locked ? `${ option.label } (${ option.tooltip })` : option.label"
        :description="option.description"
        :disabled="isDisabled || Boolean(option.disabled)"
        :prevent-focus-on-radio-groups="true"
        :data-testid="`radio-button-${i}`"
        @update:value="onUpdateValue"
      >
        <template #label>
          <span v-clean-html="option.label" />
          <RcIconTooltip
            v-if="option.locked"
            class="ml-5"
            :content="option.tooltip"
            icon-type="lock"
            @click.stop.prevent
            @keydown.enter.stop
            @keydown.space.stop
          />
        </template>
      </RadioButton>
    </template>
  </RadioGroup>
</template>
