<script lang="ts">
import KeyValue, { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import { useI18n } from '@shell/composables/useI18n';
import { toRefs } from 'vue';
import { useStore } from 'vuex';

export type Label = Row;
export interface LabelsProps {
    labels: Label[];

    onShowConfiguration?: (returnFocusSelector: string, defaultTab: string) => void;
}

</script>

<script setup lang="ts">
const props = defineProps<LabelsProps>();
const { labels } = toRefs(props);
const emit = defineEmits(['show-configuration']);

const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <KeyValue
    :propertyName="i18n.t('component.resource.detail.metadata.labels.title')"
    :rows="labels"
    type="active"
    @show-configuration="(returnFocusSelector: string) => emit('show-configuration', returnFocusSelector, 'labels-and-annotations')"
  />
</template>
