<script setup lang="ts">
import { ref, watch, markRaw, toValue } from 'vue';
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

const resource = useFetch(async() => {
  return await store.dispatch(`cluster/find`, {
    type: 'secret',
    id:   'cattle-ai-agent-system/llm-config',
    opt:  { watch: true }
  });
});

const formData = ref({});
const modelOptions = ref(models.Local);
const chatbotConfigKey = ref(Settings.OLLAMA_URL);

const updateFormConfig = (chatbot: string) => {
  const modelField = formData.value[Settings.MODEL];

  if (modelField) {
    switch (chatbot) {
    case 'OpenAI':
      chatbotConfigKey.value = Settings.OPENAI_API_KEY;
      modelOptions.value = models.OpenAI;
      break;
    case 'Gemini':
      chatbotConfigKey.value = Settings.GOOGLE_API_KEY;
      modelOptions.value = models.Gemini;
      break;
    case 'Local':
    default:
      chatbotConfigKey.value = Settings.OLLAMA_URL;
      modelOptions.value = models.Local;
      break;
    }
  }
};

watch(resource, (newResource) => {
  formData.value = cloneDeep(newResource.data.data);

  if (!formData.value[Settings.ACTIVE_CHATBOT]) {
    formData.value[Settings.ACTIVE_CHATBOT] = base64Encode('Local');
  }

  const activeChatbot = base64Decode(formData.value[Settings.ACTIVE_CHATBOT]);

  updateFormConfig(activeChatbot);
});

const updateValue = (key: string, val: string) => {
  formData.value[key] = base64Encode(val);

  if (key === Settings.ACTIVE_CHATBOT) {
    updateFormConfig(val);
    formData.value[Settings.MODEL] = base64Encode(models[val][0]);
  }
};

const save = async(btnCB: (arg: boolean) => void) => {
  try {
    resource.value.data.data = toValue(formData.value);
    await resource.value.data.save();
    btnCB(true);
  } catch (err) {
    btnCB(false);
  }
};
</script>

<template>
  <div class="form-body">
    <h1 class="mb-5">
      {{ t('aiAssistant.form.header') }}
    </h1>
    <label class="text-label mb-20">{{ t('aiAssistant.form.description') }}</label>
    <div class="form-values">
      <labeled-select
        :value="base64Decode(formData[Settings.ACTIVE_CHATBOT])"
        :label="t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.label`)"
        :options="['Local', 'OpenAI', 'Gemini']"
        @update:value="(val: string) => updateValue(Settings.ACTIVE_CHATBOT, val)"
      />

      <labeled-input
        :value="base64Decode(formData[chatbotConfigKey])"
        :label="t(`aiAssistant.form.${ chatbotConfigKey }.label`)"
        @update:value="(val: string) => updateValue(chatbotConfigKey, val)"
      />

      <labeled-select
        :value="base64Decode(formData[Settings.MODEL])"
        :label="t(`aiAssistant.form.${ Settings.MODEL}.label`)"
        :options="modelOptions"
        @update:value="(val: string) => updateValue(Settings.MODEL, val)"
      />

      <labeled-input
        :value="base64Decode(formData[Settings.EMBEDDINGS_MODEL])"
        :label="t(`aiAssistant.form.${ Settings.EMBEDDINGS_MODEL}.label`)"
        @update:value="(val: string) => updateValue(Settings.EMBEDDINGS_MODEL, val)"
      />

      <checkbox
        :value="base64Decode(formData[Settings.ENABLE_RAG])"
        :label="t(`aiAssistant.form.${ Settings.ENABLE_RAG}.label`)"
        value-when-true="true"
        @update:value="(val: string) => updateValue(Settings.ENABLE_RAG, val)"
      />

      <labeled-input
        :value="base64Decode(formData[Settings.LANGFUSE_HOST])"
        :label="t(`aiAssistant.form.${ Settings.LANGFUSE_HOST}.label`)"
        @update:value="(val: string) => updateValue(Settings.LANGFUSE_HOST, val)"
      />

      <labeled-input
        :value="base64Decode(formData[Settings.LANGFUSE_PUBLIC_KEY])"
        :label="t(`aiAssistant.form.${ Settings.LANGFUSE_PUBLIC_KEY}.label`)"
        @update:value="(val: string) => updateValue(Settings.LANGFUSE_PUBLIC_KEY, val)"
      />

      <labeled-input
        :value="base64Decode(formData[Settings.LANGFUSE_SECRET_KEY])"
        :label="t(`aiAssistant.form.${ Settings.LANGFUSE_SECRET_KEY}.label`)"
        @update:value="(val: string) => updateValue(Settings.LANGFUSE_SECRET_KEY, val)"
      />
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
