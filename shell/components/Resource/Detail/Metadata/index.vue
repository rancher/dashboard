<script setup lang="ts">
import IdentifyingInformation, { Row as IdentifyingInformationRow } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import Labels, { Label } from '@shell/components/Resource/Detail/Metadata/Labels/index.vue';
import Annotations, { Annotation } from '@shell/components/Resource/Detail/Metadata/Annotations/index.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import KeyValue from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import { computed } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

export interface MetadataProps {
  identifyingInformation: IdentifyingInformationRow[],
  labels: Label[],
  annotations: Annotation[]
}

const { identifyingInformation, labels, annotations } = defineProps<MetadataProps>();

const store = useStore();
const i18n = useI18n(store);

const showBothEmpty = computed(() => labels.length === 0 && annotations.length === 0);
</script>

<template>
  <SpacedRow class="metadata ppb-3">
    <div
      class="identifying-info"
    >
      <IdentifyingInformation :rows="identifyingInformation" />
    </div>
    <!-- In the renders we want the same empty message that the labels/annotations show but we want it to span two columns. This is a cheap way to keep the look consistent without duplicating code. -->
    <div
      v-if="showBothEmpty"
      class="labels-and-annotations-empty"
    >
      <KeyValue
        :rows="[]"
        :propertyName="i18n.t('component.resource.detail.metadata.labelsAndAnnotations')"
      />
    </div>
    <!-- I'm not using v-else here so I can maintain the spacing correctly with the other columns in other rows. -->
    <div
      v-if="!showBothEmpty"
      class="labels"
    >
      <Labels :labels="labels" />
    </div>
    <div
      v-if="!showBothEmpty"
      class="annotations"
    >
      <Annotations :annotations="annotations" />
    </div>
  </SpacedRow>
</template>

<style lang="scss" scoped>
.metadata {
    .labels-and-annotations-empty {
      grid-column: span 2;
    }

    border-bottom: 1px solid var(--border);
}
</style>
