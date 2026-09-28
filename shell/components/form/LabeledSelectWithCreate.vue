<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { _CREATE } from '@shell/config/query-params';
import { useI18n } from '@shell/composables/useI18n';
import type { SelectOption } from '@shell/types/components/labeledSelect';
import type { Validator } from '@shell/utils/validators/formRules/index';

/**
 * A LabeledSelect that prepends a "Create new" highlighted option.
 * When the user picks "Create new", the select is replaced by a LabeledInput
 */
defineOptions({ name: 'LabeledSelectWithCreate' });

type FocusableInput = { focus: () => void };

interface Props {
  value?: string | null;
  options?: SelectOption[];
  name?: string;
  label?: string;
  /** takes precedence over label if set */
  labelKey?: string | null;
  /** Text shown on the "Create new" option in the dropdown */
  createLabel?: string;
  /** Placeholder shown in the new-value input */
  createPlaceholder?: string;
  /** Placeholder shown in the select when not creating */
  placeholder?: string;
  mode?: string;
  loading?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  rules?: Validator[];
  appendToBody?: boolean;
  /**
   * When false, the "Create new" option is not shown.
   * Use this to gate creation on RBAC permissions.
   */
  createAllowed?: boolean;
  requireDirty?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value:             null,
  options:           () => [],
  name:              undefined,
  label:             '',
  labelKey:          null,
  createLabel:       undefined,
  createPlaceholder: '',
  placeholder:       '',
  mode:              _CREATE,
  loading:           false,
  disabled:          false,
  clearable:         false,
  rules:             () => [],
  appendToBody:      false,
  createAllowed:     true,
  requireDirty:      true,
  required:          false,
});

const emit = defineEmits<{(e: 'update:value', value: string): void, (e: 'creating'): void, (e: 'cancel'): void}>();

const store = useStore();
const { t } = useI18n(store);

const creating = ref(false);
const newValue = ref('');
const inputRef = ref<FocusableInput | null>(null);

const createLabelText = computed(() => props.createLabel || t('generic.createNew'));

const selectOptions = computed<SelectOption[]>(() => {
  if (!props.createAllowed) {
    return props.options;
  }

  const createEntry: SelectOption = {
    label: createLabelText.value,
    value: '__create__',
    kind:  'highlighted',
  };
  const divider: SelectOption = {
    label:    'divider',
    disabled: true,
    kind:     'divider',
  };

  return [createEntry, divider, ...props.options];
});

function onSelecting(opt: SelectOption | null) {
  if (!opt || opt.value === '__create__') {
    creating.value = true;
    newValue.value = '';
    emit('creating');
    emit('update:value', '');
    nextTick(() => inputRef.value?.focus());
  }
}

function cancelCreate() {
  creating.value = false;
  newValue.value = '';
  emit('cancel');
}

function onCreateInput(val: string) {
  newValue.value = val;
  emit('update:value', val);
}

function onSelectChange(val: string) {
  if (val !== '__create__') {
    emit('update:value', val);
  }
}
</script>

<template>
  <div class="labeled-select-with-create">
    <!-- New-value input mode -->
    <LabeledInput
      v-if="creating"
      ref="inputRef"
      :name="name"
      :value="newValue"
      :label="labelKey ? t(labelKey) : label"
      :placeholder="createPlaceholder"
      :mode="mode"
      :rules="rules"
      :required="required"
      class="create-input"
      @update:value="onCreateInput"
      @keyup.escape="cancelCreate"
    >
      <template #suffix>
        <button
          :aria-label="t('namespace.cancelCreateAriaLabel')"
          @click="cancelCreate"
        >
          <i
            v-clean-tooltip="t('generic.cancel')"
            class="icon icon-close align-value"
          />
        </button>
      </template>
    </LabeledInput>

    <!-- Select mode -->
    <LabeledSelect
      v-else
      :name="name"
      :value="value ?? undefined"
      :label="labelKey ? t(labelKey) : label"
      :placeholder="placeholder"
      :options="selectOptions"
      :mode="mode"
      :loading="loading"
      :disabled="disabled"
      :clearable="clearable"
      :rules="rules"
      :append-to-body="appendToBody"
      :require-dirty="requireDirty"
      :required="required"
      :searchable="true"
      @selecting="onSelecting"
      @update:value="onSelectChange"
    />
  </div>
</template>

<style lang="scss" scoped>
button {
  all: unset;
  display: flex;
  align-items: center;
  align-self: flex-end;
  cursor: pointer;
}

.labeled-select-with-create {
  width: 100%;
}
</style>
