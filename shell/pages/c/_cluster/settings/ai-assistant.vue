<script setup lang="ts">
import { ref, reactive, watch, markRaw } from 'vue';
import { useStore } from 'vuex';
import { cloneDeep } from 'lodash';

import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useI18n } from '@shell/composables/useI18n';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import AsyncButton from '@shell/components/AsyncButton';

const store = useStore();
const { t } = useI18n(store);

enum Settings {
  EMBEDDINGS_MODEL = 'EMBEDDINGS_MODEL',
  ENABLE_RAG = 'ENABLE_RAG',
  GOOGLE_API_KEY = 'GOOGLE_API_KEY',
  LANGFUSE_HOST = 'LANGFUSE_HOST',
  LANGFUSE_PUBLIC_KEY = 'LANGFUSE_PUBLIC_KEY',
  LANGFUSE_SECRET_KEY = 'LANGFUSE_SECRET_KEY',
  MODEL = 'MODEL',
  OLLAMA_URL = 'OLLAMA_URL',
  OPENAI_API_KEY = 'OPENAI_API_KEY',
  SYSTEM_PROMPT = 'SYSTEM_PROMPT',
  ACTIVE_CHATBOT = 'ACTIVE_CHATBOT',
}

const models = {
  Local:  ['qwen3:4b'],
  OpenAI: [
    'gpt-4o',
    'gpt-4o-mini',
    'o3-mini',
    'o3',
    'o4-mini',
    'gpt-4.1',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  Gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ]
};

const schema = reactive({
  [Settings.ACTIVE_CHATBOT]:      { type: markRaw(LabeledSelect), args: { options: ['Local', 'OpenAI', 'Gemini'] } },
  [Settings.OLLAMA_URL]:          { type: markRaw(LabeledInput) },
  [Settings.MODEL]:               { type: markRaw(LabeledSelect), args: { options: models.Local } },
  [Settings.EMBEDDINGS_MODEL]:    { type: markRaw(LabeledInput) },
  [Settings.ENABLE_RAG]:          { type: markRaw(Checkbox), args: { valueWhenTrue: 'true' } },
  [Settings.GOOGLE_API_KEY]:      { type: markRaw(LabeledInput) },
  [Settings.LANGFUSE_HOST]:       { type: markRaw(LabeledInput) },
  [Settings.LANGFUSE_PUBLIC_KEY]: { type: markRaw(LabeledInput) },
  [Settings.LANGFUSE_SECRET_KEY]: { type: markRaw(LabeledInput) },
  [Settings.OPENAI_API_KEY]:      { type: markRaw(LabeledInput) },
});

const resource = useFetch(async() => {
  return await store.dispatch(`cluster/find`, {
    type: 'secret',
    id:   'cattle-ai-agent-system/llm-config',
    opt:  { watch: true }
  });
});

const formData = ref({});

watch(resource, (newResource) => {
  formData.value = cloneDeep(newResource.data.data);

  if (!formData.value[Settings.ACTIVE_CHATBOT]) {
    formData.value[Settings.ACTIVE_CHATBOT] = base64Encode('Local');
  }
});

const updateValue = (key: string, val: string) => {
  formData.value[key] = base64Encode(val);

  if (key === Settings.ACTIVE_CHATBOT) {
    switch (val) {
    case 'OpenAi':
      schema[Settings.MODEL].args.options = models.OpenAI;
      break;
    case 'Gemini':
      schema[Settings.MODEL].args.options = models.Gemini;
      break;
    case 'Local':
      schema[Settings.MODEL].args.options = models.Local;
      break;
    }
  }
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
        v-for="(value, key) in schema"
        :key="key"
      >
        <component
          :is="value.type"
          v-bind="value.args"
          :value="base64Decode(formData[key])"
          :label="t(`aiAssistant.form.${ key }.label`)"
          @update:value="(val: string) => updateValue(key, val)"
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
