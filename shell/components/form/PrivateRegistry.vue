<script setup lang="ts">
import { ref, watch } from 'vue';
import Banner from '@components/Banner/Banner.vue';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

const props = defineProps<{
  value?: string | null;
  enabled?: boolean;
  mode?: string;
  rules?: Function[];
  checkboxTestId?: string;
  inputTestId?: string;
}>();

const emit = defineEmits<{
  'update:value': [val: string | null];
  'update:enabled': [val: boolean];
}>();

const showInput = ref(!!props.value);

watch(() => props.enabled, (neu) => {
  if (typeof neu === 'boolean' && neu !== showInput.value) {
    showInput.value = neu;
  }
});

watch(showInput, (neu, old) => {
  if (neu !== props.enabled) {
    emit('update:enabled', neu);
  }
  if (!neu && old && props.value) {
    emit('update:value', null);
  }
});

watch(() => props.value, (neu) => {
  if (!!neu && !showInput.value) {
    showInput.value = true;
  }
});
</script>

<template>
  <Banner
    color="info"
    class="mt-0"
    label-key="cluster.privateRegistry.importedDescription"
  />
  <Checkbox
    v-model:value="showInput"
    class="mb-20"
    :mode="mode"
    :label="t('cluster.privateRegistry.label')"
    :data-testid="checkboxTestId"
  />
  <LabeledInput
    v-if="showInput"
    :value="value as string"
    :mode="mode"
    :rules="rules"
    :required="true"
    label-key="catalog.chart.registry.custom.inputLabel"
    :data-testid="inputTestId"
    :placeholder="t('catalog.chart.registry.custom.placeholder')"
    @update:value="(val) => emit('update:value', val)"
  />
</template>
