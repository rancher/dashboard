<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceTemplateUtils from '@shell/utils/resource-template';

interface Props {
  resourceType: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{(e: 'apply', configMap: any): void }>();

const store = useStore();
const { t } = useI18n(store);

const templates = ref<any[]>([]);
const selectedTemplateId = ref<string | null>(null);

onMounted(async() => {
  templates.value = await ResourceTemplateUtils.fetchTemplates(store, props.resourceType) || [];
});

const templateOptions = computed(() => templates.value.map((cm: any) => ({
  label: `${ cm.metadata.namespace }/${ cm.metadata.name }`,
  value: cm.id,
})));

const selectedTemplate = computed(() => templates.value.find((cm: any) => cm.id === selectedTemplateId.value));

function apply() {
  if (selectedTemplate.value) {
    emit('apply', selectedTemplate.value);
  }
}
</script>

<template>
  <div
    v-if="templateOptions.length"
    class="resource-template-selector"
  >
    <LabeledSelect
      v-model:value="selectedTemplateId"
      class="template-select"
      :label="t('resourceTemplateSelector.label')"
      :placeholder="t('resourceTemplateSelector.placeholder')"
      :options="templateOptions"
      mode="edit"
    />
    <RcButton
      variant="secondary"
      :disabled="!selectedTemplateId"
      @click="apply"
    >
      {{ t('resourceTemplateSelector.apply') }}
    </RcButton>
  </div>
</template>

<style lang='scss' scoped>
  .resource-template-selector {
    display: flex;
    align-items: flex-end;
    gap: 10px;

    .template-select {
      min-width: 240px;
    }
  }
</style>
