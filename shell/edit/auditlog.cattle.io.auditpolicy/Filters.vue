<script setup lang="ts">
import { ref } from 'vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { AuditPolicy, FilterRule } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';

// Component Props & Emits
const props = defineProps({
  value: {
    type:    Object,
    default: () => ({})
  },
  mode: {
    type:    String,
    default: 'create'
  },
});

const emit = defineEmits<{
  'update:value': [value: AuditPolicy];
}>();

// Default Values & Reactive Spec
const defaults: AuditPolicy = { filters: [] };
const spec = ref<AuditPolicy>({ ...defaults, ...props.value });
const defaultAddValue: FilterRule = {
  action:     'allow',
  requestURI: '',
};

// Methods
function addRow(key: 'action' | 'requestURI', filters: FilterRule[]) {
  const valueToEmit = { ...props.value, ...spec.value };

  valueToEmit.filters = filters;

  emit('update:value', valueToEmit);
}

function updateRow(key: 'action' | 'requestURI', index: number, value: string) {
  const valueToEmit = { ...props.value, ...spec.value };

  if (!valueToEmit.filters) {
    valueToEmit.filters = [];
  }

  // Ensure the filter exists at the given index
  if (!valueToEmit.filters[index]) {
    valueToEmit.filters[index] = { action: '', requestURI: '' };
  }

  valueToEmit.filters[index][key] = value;
  emit('update:value', valueToEmit);
}
</script>

<template>
  <div>
    <div class="row mb-40">
      <div class="col span-12">
        <ArrayList
          key="headers"
          v-model:value="spec.filters"
          :value-placeholder="t('auditPolicy.filters.placeholder')"
          :add-label="t('auditPolicy.filters.add')"
          :mode="mode"
          :protip="false"
          :defaultAddValue="defaultAddValue"
          :show-header="true"
          @update:value="addRow('action', $event)"
        >
          <template v-slot:column-headers>
            <div class="filters-heading mb-10">
              <div
                class="row"
              >
                <div class="col span-6">
                  <span class="text-label">{{ t('auditPolicy.filters.action.title') }}</span>
                </div>
                <div class="col span-6 send-to">
                  <span class="text-label">{{ t('auditPolicy.filters.requestURI.title') }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-slot:columns="scope">
            <div class="row">
              <div class="col span-6">
                <LabeledSelect
                  v-model:value="scope.row.value.action"
                  :options="[{ value: 'allow', label: t('auditPolicy.filters.action.allow')},{ value: 'deny', label: t('auditPolicy.filters.action.deny') }]"
                  :mode="mode"
                  :placeholder="t('auditPolicy.filters.action.placeholder')"
                  @update:value="updateRow('action', scope.i, $event)"
                />
              </div>
              <div class="col span-6">
                <LabeledInput
                  v-model:value="scope.row.value.requestURI"
                  :mode="mode"
                  :placeholder="t('auditPolicy.filters.requestURI.placeholder')"
                  @update:value="updateRow('requestURI', scope.i, $event, )"
                />
              </div>
            </div>
          </template>
        </ArrayList>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .filters-heading {
    display: grid;
    grid-template-columns: auto $array-list-remove-margin;
  }
</style>
