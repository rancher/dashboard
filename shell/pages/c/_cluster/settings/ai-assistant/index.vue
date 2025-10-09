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
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import ToggleGroup from '@shell/pages/c/_cluster/settings/ai-assistant/toggle-group.vue';

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
  <div>
    <h1>
      {{ t('aiAssistant.form.header') }}
    </h1>
    <label class="text-label">{{ t('aiAssistant.form.description') }}</label>
    <hr class="mb-20">
    <h4>AI Chatbot Provider</h4>
    <label class="text-label">Select the AI provider for your chatbot</label>
    <hr class="mb-20">
    <div class="form-values">
      <ToggleGroup
        :model-value="base64Decode(formData[Settings.ACTIVE_CHATBOT])"
        :items="[
          { name: 'Local', description: 'Run models locally with Ollama', icon: require('@shell/assets/images/providers/local.svg'), value: 'Local' },
          { name: 'OpenAI', description: `Use OpenAI's GPT models`, icon: require('@shell/assets/images/providers/OpenAI.svg'), value: 'OpenAI' },
          { name: 'Gemini', description: `Use Google's Gemini models`, icon: require('@shell/assets/images/providers/Gemini.svg'), value: 'Gemini' },
        ]"
        @update:model-value="(val: string) => updateValue(Settings.ACTIVE_CHATBOT, val)"
      />
      <banner
        v-if="base64Decode(formData[Settings.ACTIVE_CHATBOT]) !== 'Local'"
        icon="icon-warning"
        color="warning"
      >
        Privacy Notice:
        <br>
        When using external providers like Gemini, your prompts and data will be sent to third-party servers. These providers may use your data according to their own privacy policies. For sensitive or confidential information, consider using a local provider instead.
      </banner>

      <div class="field">
        <labeled-input
          :value="base64Decode(formData[chatbotConfigKey])"
          :label="t(`aiAssistant.form.${ chatbotConfigKey }.label`)"
          @update:value="(val: string) => updateValue(chatbotConfigKey, val)"
        />
        <label class="text-label">
          {{ t(`aiAssistant.form.${ chatbotConfigKey }.description`) }}
        </label>
      </div>

      <div class="field">
        <labeled-select
          :value="base64Decode(formData[Settings.MODEL])"
          :label="t(`aiAssistant.form.${ Settings.MODEL}.label`)"
          :options="modelOptions"
          @update:value="(val: string) => updateValue(Settings.MODEL, val)"
        />
        <label class="text-label">
          {{ t(`aiAssistant.form.${ Settings.MODEL}.description`) }}
        </label>
      </div>

      <advanced-section>
        <h4>RAG (Retrieval-Augmented Generation)</h4>
        <label class="text-label">Enable RAG to make your chatbot smarter by giving it access to external knowledge</label>
        <hr>
        <banner
          icon="icon-notify-warning"
          color="info"
        >
          RAG (Retrieval-Augmented Generation) allows the chatbot to search a knowledge base before generating responses. This reduces hallucinations and provides more accurate, up-to-date answers grounded in your specific data.
        </banner>
        <div class="form-values mb-20">
          <checkbox
            :value="base64Decode(formData[Settings.ENABLE_RAG])"
            :label="t(`aiAssistant.form.${ Settings.ENABLE_RAG}.label`)"
            value-when-true="true"
            @update:value="(val: string) => updateValue(Settings.ENABLE_RAG, val)"
          />

          <div class="field">
            <labeled-input
              :value="base64Decode(formData[Settings.EMBEDDINGS_MODEL])"
              :label="t(`aiAssistant.form.${ Settings.EMBEDDINGS_MODEL}.label`)"
              @update:value="(val: string) => updateValue(Settings.EMBEDDINGS_MODEL, val)"
            />
            <label class="text-label">
              The model used to create embeddings for RAG
            </label>
          </div>
        </div>
        <h4>Langfuse Configuration</h4>
        <label class="text-label">
          Connect to Langfuse to monitor, trace, and debug your AI assistant
        </label>
        <hr>
        <banner
          icon="icon-notify-warning"
          color="info"
        >
          Langfuse is an open-source tool for monitoring LLM applications. These settings connect your chatbot to a Langfuse server so you can analyze performance and troubleshoot issues. The host is the server address, while the secret and public keys authenticate your application.
        </banner>
        <div class="form-values">
          <div class="field">
            <labeled-input
              :value="base64Decode(formData[Settings.LANGFUSE_HOST])"
              :label="t(`aiAssistant.form.${ Settings.LANGFUSE_HOST}.label`)"
              @update:value="(val: string) => updateValue(Settings.LANGFUSE_HOST, val)"
            />
            <label class="text-label">
              {{ t(`aiAssistant.form.${ Settings.LANGFUSE_HOST}.description`) }}
            </label>
          </div>

          <div class="field">
            <labeled-input
              :value="base64Decode(formData[Settings.LANGFUSE_PUBLIC_KEY])"
              :label="t(`aiAssistant.form.${ Settings.LANGFUSE_PUBLIC_KEY}.label`)"
              @update:value="(val: string) => updateValue(Settings.LANGFUSE_PUBLIC_KEY, val)"
            />
            <label class="text-label">
              {{ t(`aiAssistant.form.${ Settings.LANGFUSE_PUBLIC_KEY}.description`) }}
            </label>
          </div>

          <div class="field">
            <labeled-input
              :value="base64Decode(formData[Settings.LANGFUSE_SECRET_KEY])"
              :label="t(`aiAssistant.form.${ Settings.LANGFUSE_SECRET_KEY}.label`)"
              @update:value="(val: string) => updateValue(Settings.LANGFUSE_SECRET_KEY, val)"
            />
            <label class="text-label">
              {{ t(`aiAssistant.form.${ Settings.LANGFUSE_SECRET_KEY}.description`) }}
            </label>
          </div>
        </div>
      </advanced-section>
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
  gap: 1.5rem;
  max-width: 48rem;
  flex-grow: 1;
}

.form-footer {
  position: sticky;
  bottom: 24px;
  display: flex;
  flex-direction: row-reverse;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
