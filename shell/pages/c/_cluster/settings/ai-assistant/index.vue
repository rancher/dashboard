<script setup lang="ts">
import { ref, watch, toValue } from 'vue';
import { useStore } from 'vuex';
import { cloneDeep } from 'lodash';

import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useI18n } from '@shell/composables/useI18n';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { _EDIT } from '@shell/config/query-params';
import AsyncButton from '@shell/components/AsyncButton';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import Loading from '@shell/components/Loading.vue';
import ToggleGroup from '@shell/pages/c/_cluster/settings/ai-assistant/toggle-group.vue';
import { Settings, FormData } from '@shell/pages/c/_cluster/settings/ai-assistant/types';

const store = useStore();
const { t } = useI18n(store);

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

const activeChatbotOptions = [
  {
    name:        t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.options.local.name`),
    description: t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.options.local.description`, {}, true),
    icon:        require('@shell/assets/images/providers/local.svg'),
    value:       'Local',
  },
  {
    name:        t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.options.openAi.name`),
    description: t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.options.openAi.description`, {}, true),
    icon:        require('@shell/assets/images/providers/OpenAI.svg'),
    value:       'OpenAI',
  },
  {
    name:        t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.options.gemini.name`),
    description: t(`aiAssistant.form.${ Settings.ACTIVE_CHATBOT }.options.gemini.description`, {}, true),
    icon:        require('@shell/assets/images/providers/Gemini.svg'),
    value:       'Gemini',
  },
];

const resource = useFetch(async() => {
  return await store.dispatch(`cluster/find`, {
    type: 'secret',
    id:   'cattle-ai-agent-system/llm-config',
    opt:  { watch: true }
  });
});

const formData = ref<FormData>({});
const modelOptions = ref(models.Local);
const chatbotConfigKey = ref<Settings.OLLAMA_URL | Settings.GOOGLE_API_KEY | Settings.OPENAI_API_KEY>(Settings.OLLAMA_URL);

const updateFormConfig = (chatbot: string | undefined) => {
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
  const resourceClone = cloneDeep(newResource?.data?.data);

  for (const entry in resourceClone) {
    resourceClone[entry] = base64Decode(resourceClone[entry]);
  }

  formData.value = resourceClone;

  if (!formData.value[Settings.ACTIVE_CHATBOT]) {
    formData.value[Settings.ACTIVE_CHATBOT] = 'Local';
  }

  const activeChatbot = formData.value[Settings.ACTIVE_CHATBOT];

  updateFormConfig(activeChatbot);
});

const updateValue = (key: Settings, val: string | undefined) => {
  formData.value[key] = val;

  if (key === Settings.ACTIVE_CHATBOT) {
    updateFormConfig(val);
    formData.value[Settings.MODEL] = models[val as keyof typeof models][0];
  }
};

const save = async(btnCB: (arg: boolean) => void) => {
  try {
    const formDataToSave: { [key: string]: string } = {};
    const formDataObject = toValue(formData.value);

    for (const key of Object.keys(formDataObject) as Array<keyof FormData>) {
      const value = formDataObject[key];

      if (value) {
        formDataToSave[key] = base64Encode(value);
      }
    }

    resource.value.data.data = formDataToSave;
    await resource.value.data.save();
    btnCB(true);
  } catch (err) {
    btnCB(false);
  }
};
</script>

<template>
  <loading v-if="resource.loading" />
  <div v-else>
    <h1>
      {{ t('aiAssistant.form.header') }}
    </h1>
    <label class="text-label">{{ t('aiAssistant.form.description') }}</label>
    <hr class="mb-20">
    <h4>{{ t('aiAssistant.form.section.provider.header') }}</h4>
    <label class="text-label mb-20">{{ t('aiAssistant.form.section.provider.description') }}</label>
    <div class="form-values">
      <ToggleGroup
        :model-value="formData[Settings.ACTIVE_CHATBOT]"
        :items="activeChatbotOptions"
        @update:model-value="(val: string | undefined) => updateValue(Settings.ACTIVE_CHATBOT, val)"
      />
      <banner
        v-if="formData[Settings.ACTIVE_CHATBOT] !== 'Local'"
        color="warning"
        class="mt-0 mb-0"
      >
        <span>
          <b>{{ t('aiAssistant.form.section.provider.banner.header', {}, true) }}</b>
          <br>
          {{ t('aiAssistant.form.section.provider.banner.description') }}
        </span>
      </banner>

      <div class="form-field">
        <labeled-input
          :value="formData[chatbotConfigKey]"
          :label="t(`aiAssistant.form.${ chatbotConfigKey }.label`)"
          @update:value="(val: string) => updateValue(chatbotConfigKey, val)"
        />
        <label class="text-label">
          {{ t(`aiAssistant.form.${ chatbotConfigKey }.description`) }}
        </label>
      </div>

      <div class="form-field">
        <labeled-select
          :value="formData[Settings.MODEL]"
          :label="t(`aiAssistant.form.${ Settings.MODEL}.label`)"
          :options="modelOptions"
          @update:value="(val: string) => updateValue(Settings.MODEL, val)"
        />
        <label class="text-label">
          {{ t(`aiAssistant.form.${ Settings.MODEL}.description`) }}
        </label>
      </div>

      <advanced-section
        :mode="_EDIT"
        class="mt-0 font-bold"
      >
        <h4 class="mt-30">
          {{ t('aiAssistant.form.section.rag.header') }}
        </h4>
        <label class="text-label">{{ t('aiAssistant.form.section.rag.description') }}</label>
        <hr>
        <banner
          class="form-sub"
          color="info"
        >
          {{ t('aiAssistant.form.section.rag.banner') }}
        </banner>
        <div class="form-values form-sub mb-30">
          <checkbox
            :value="formData[Settings.ENABLE_RAG]"
            :label="t(`aiAssistant.form.${ Settings.ENABLE_RAG}.label`)"
            value-when-true="true"
            @update:value="(val: string) => updateValue(Settings.ENABLE_RAG, val)"
          />

          <div class="form-field">
            <labeled-input
              :value="formData[Settings.EMBEDDINGS_MODEL]"
              :label="t(`aiAssistant.form.${ Settings.EMBEDDINGS_MODEL}.label`)"
              @update:value="(val: string) => updateValue(Settings.EMBEDDINGS_MODEL, val)"
            />
            <label class="text-label">
              The model used to create embeddings for RAG
            </label>
          </div>
        </div>
        <h4>
          {{ t('aiAssistant.form.section.langfuse.header') }}
        </h4>
        <label class="text-label">
          {{ t('aiAssistant.form.section.langfuse.description') }}
        </label>
        <hr>
        <banner
          class="form-sub"
          color="info"
        >
          {{ t('aiAssistant.form.section.langfuse.banner') }}
        </banner>
        <div class="form-values form-sub">
          <div class="form-field">
            <labeled-input
              :value="formData[Settings.LANGFUSE_HOST]"
              :label="t(`aiAssistant.form.${ Settings.LANGFUSE_HOST}.label`)"
              @update:value="(val: string) => updateValue(Settings.LANGFUSE_HOST, val)"
            />
            <label class="text-label">
              {{ t(`aiAssistant.form.${ Settings.LANGFUSE_HOST}.description`) }}
            </label>
          </div>

          <div class="form-field">
            <labeled-input
              :value="formData[Settings.LANGFUSE_PUBLIC_KEY]"
              :label="t(`aiAssistant.form.${ Settings.LANGFUSE_PUBLIC_KEY}.label`)"
              @update:value="(val: string) => updateValue(Settings.LANGFUSE_PUBLIC_KEY, val)"
            />
            <label class="text-label">
              {{ t(`aiAssistant.form.${ Settings.LANGFUSE_PUBLIC_KEY}.description`) }}
            </label>
          </div>

          <div class="form-field">
            <labeled-input
              :value="formData[Settings.LANGFUSE_SECRET_KEY]"
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
  max-width: 50rem;
  flex-grow: 1;
}

.form-footer {
  position: sticky;
  bottom: 24px;
  display: flex;
  flex-direction: row-reverse;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-sub {
  padding-left: 1.5rem;
}

div.mt-0 {
  margin-top: 0 !important;
}

div.mb-0 {
  margin-bottom: 0 !important;
}
</style>
