<script lang="ts">
import KeyValue, { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

export type Annotation = Row;

export interface AnnotationsProps {
  annotations: Annotation[];

  onShowConfiguration?: (returnFocusSelector: string, defaultTab: string) => void;
}

</script>

<script setup lang="ts">
const { annotations } = defineProps<AnnotationsProps>();
const emit = defineEmits(['show-configuration']);
const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <KeyValue
    :propertyName="i18n.t('component.resource.detail.metadata.annotations.title')"
    :rows="annotations"
    type="active"

    @show-configuration="(returnFocusSelector: string) => emit('show-configuration', returnFocusSelector, 'labels-and-annotations')"
  />
</template>
