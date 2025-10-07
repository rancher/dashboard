<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStore } from 'vuex';

import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useI18n } from '@shell/composables/useI18n';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';

const store = useStore();
const { t } = useI18n(store);

const resource = useFetch(async() => {
  return await store.dispatch(`cluster/find`, {
    type: 'secret',
    id:   'cattle-ai-agent-system/llm-config',
    opt:  { watch: true }
  });
});

const formData = ref({});

watch(resource, (newResource) => {
  formData.value = newResource.data.data;
});

const updateValue = (key: string, val: string) => {
  formData.value[key] = base64Encode(val);
};

const save = () => {

};
</script>

<template>
  <div class="form-body">
    <h1 class="mb-5">
      {{ t('aiAssistant.form.header') }}
    </h1>
    <label class="text-label mb-20">{{ t('aiAssistant.form.description') }}</label>
    <div class="form-values">
      <template
        v-for="(value, key) in formData"
        :key="key"
      >
        <labeled-input
          :value="base64Decode(value)"
          :label="t(`aiAssistant.form.${ key }.label`)"
          @update:value="(val) => updateValue(key, val)"
        />
        <br>
      </template>
    </div>
    <div class="form-footer">
      <async-button
        action-label="Apply"
        @click="save"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-body {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.form-values {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 24rem;
  flex-grow: 1;
}

.form-footer {
  position: sticky;
  bottom: 24px;
  display: flex;
  flex-direction: row-reverse;
}
</style>
