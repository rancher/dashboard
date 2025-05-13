<script lang="ts">
import IdentifyingInformation, { extractDefaultIdentifyingInformation, Row as IdentifyingInformationRow } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation.vue';
import Labels, { extractDefaultLabels, Label } from '@shell/components/Resource/Detail/Metadata/Labels.vue';
import Annotations, { extractDefaultAnnotations, Annotation } from '@shell/components/Resource/Detail/Metadata/Annotations.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import { I18n } from '@shell/composables/useI18n';

export const extractDefaultMetadata = (resource: any, i18n: I18n) => {
  return {
    identifyingInformation: extractDefaultIdentifyingInformation(resource, i18n),
    labels:                 extractDefaultLabels(resource),
    annotations:            extractDefaultAnnotations(resource)
  };
};
</script>

<script setup lang="ts">
export interface MetadataProps {
  identifyingInformation: IdentifyingInformationRow[],
  labels: Label[],
  annotations: Annotation[]
}

const { identifyingInformation, labels, annotations } = defineProps<MetadataProps>();
</script>

<template>
  <SpacedRow class="metadata">
    <div slot="identifying-info">
      <IdentifyingInformation :rows="identifyingInformation" />
    </div>
    <div slot="labels">
      <Labels :labels="labels" />
    </div>
    <div slot="annotations">
      <Annotations :annotations="annotations" />
    </div>
  </SpacedRow>
</template>

<style lang="scss" scoped>
.metadata {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;

    & > * {
        flex: 1;
    }
}
</style>
