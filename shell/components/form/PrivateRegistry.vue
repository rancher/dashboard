<script setup lang="ts">
import { ref, watch } from 'vue';
import Banner from '@components/Banner/Banner.vue';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

const props = defineProps<{
  value?: string | null;
  mode?: string;
  rules?: Function[];
  checkboxTestId?: string;
  inputTestId?: string;
}>();

const emit = defineEmits<{
  'update:value': [val: string | null];
}>();

const showInput = ref(!!props.value);

watch(showInput, (neu) => {
  if (!neu) {
    emit('update:value', null);
  }
});

watch(() => props.value, (neu) => {
  if (!!neu && !showInput.value) {
    showInput.value = true;
  }
});

const onInput = (val: string) => {
  emit('update:value', val);
};
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
    label-key="catalog.chart.registry.custom.inputLabel"
    :data-testid="inputTestId"
    :placeholder="t('catalog.chart.registry.custom.placeholder')"
    @update:value="onInput"
  />
</template>
