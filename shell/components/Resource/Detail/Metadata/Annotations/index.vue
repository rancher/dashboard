<script lang="ts">
import KeyValue, { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

export type Annotation = Row;

export interface AnnotationsProps {
  annotations: Annotation[];
}

</script>

<script setup lang="ts">
const { annotations } = defineProps<AnnotationsProps>();
const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <KeyValue
    :propertyName="i18n.t('component.resource.detail.metadata.annotations.title')"
    :rows="annotations"
    :outline="true"
  />
</template>
