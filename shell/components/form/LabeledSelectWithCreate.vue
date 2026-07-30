<script setup>
import { ref, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { useI18n } from '@shell/composables/useI18n';

/**
 * A LabeledSelect that prepends a "Create new" highlighted option.
 * When the user picks "Create new", the select is replaced by a LabeledInput
 */
defineOptions({ name: 'LabeledSelectWithCreate' });

const props = defineProps({
  value: {
    type:    String,
    default: null,
  },
  options: {
    type:    Array,
    default: () => [],
  },

  label: {
    type:    String,
    default: '',
  },
  /** takes precedence over label if set */
  labelKey: {
    type:    String,
    default: null,
  },
  /** Text shown on the "Create new" option in the dropdown */
  createLabel: {
    type:    String,
    default: 'Create new…',
  },
  /** Placeholder shown in the new-value input */
  createPlaceholder: {
    type:    String,
    default: '',
  },
  /** Placeholder shown in the select when not creating */
  placeholder: {
    type:    String,
    default: '',
  },
  mode: {
    type:    String,
    default: 'create',
  },
  loading: {
    type:    Boolean,
    default: false,
  },
  disabled: {
    type:    Boolean,
    default: false,
  },
  clearable: {
    type:    Boolean,
    default: false,
  },
  rules: {
    type:    Array,
    default: () => [],
  },
  appendToBody: {
    type:    Boolean,
    default: false,
  },
  /**
   * When false, the "Create new" option is not shown.
   * Use this to gate creation on RBAC permissions.
   */
  createAllowed: {
    type:    Boolean,
    default: true,
  },
  requireDirty: {
    type:    Boolean,
    default: true,
  },
  required: {
    type:    Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value', 'creating', 'cancel']);

const store = useStore();
const { t } = useI18n(store);

const creating = ref(false);
const newValue = ref('');
const inputRef = ref(null);

const selectOptions = computed(() => {
  if (!props.createAllowed) {
    return props.options;
  }

  const createEntry = {
    label: props.createLabel,
    value: '__create__',
    kind:  'highlighted',
  };
  const divider = {
    label:    'divider',
    disabled: true,
    kind:     'divider',
  };

  return [createEntry, divider, ...props.options];
});

function onSelecting(opt) {
  if (!opt || opt.value === '__create__') {
    creating.value = true;
    newValue.value = '';
    emit('creating');
    nextTick(() => inputRef.value?.focus());
  }
}

function cancelCreate() {
  creating.value = false;
  newValue.value = '';
  emit('cancel');
}

function onCreateInput(val) {
  newValue.value = val;
  emit('update:value', val);
}

function onSelectChange(val) {
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
      :value="newValue"
      :label="labelKey ? t(labelKey) : label"
      :placeholder="createPlaceholder"
      :mode="mode"
      :rules="rules"
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
      :value="value"
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
