<script setup lang="ts">
import IdentifyingInformation, { Row as IdentifyingInformationRow } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import Labels, { Label } from '@shell/components/Resource/Detail/Metadata/Labels/index.vue';
import Annotations, { Annotation } from '@shell/components/Resource/Detail/Metadata/Annotations/index.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import KeyValue from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import { computed } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { ExtensionPoint, PanelLocation } from '@shell/core/types';
import ExtensionPanel from '@shell/components/ExtensionPanel.vue';

export interface MetadataProps {
  resource: any;
  identifyingInformation: IdentifyingInformationRow[],
  labels: Label[],
  annotations: Annotation[],
  onShowConfiguration?: (returnFocusSelector: string) => void;
}

const {
  resource, identifyingInformation, labels, annotations
} = defineProps<MetadataProps>();
const emit = defineEmits(['show-configuration']);

const store = useStore();
const i18n = useI18n(store);

const showBothEmpty = computed(() => labels.length === 0 && annotations.length === 0);
</script>

<template>
  <SpacedRow
    class="metadata"
    v-bind="$attrs"
  >
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
        type="active"
        :rows="[]"
        :propertyName="i18n.t('component.resource.detail.metadata.labelsAndAnnotations')"
        @show-configuration="(returnFocusSelector: string, defaultTab: string) => emit('show-configuration', returnFocusSelector, defaultTab)"
      />
    </div>
    <!-- I'm not using v-else here so I can maintain the spacing correctly with the other columns in other rows. -->
    <div
      v-if="!showBothEmpty"
      class="labels"
    >
      <Labels
        :labels="labels"
        @show-configuration="(returnFocusSelector: string, defaultTab: string) => emit('show-configuration', returnFocusSelector, defaultTab)"
      />
    </div>
    <div
      v-if="!showBothEmpty"
      class="annotations"
    >
      <Annotations
        :annotations="annotations"
        @show-configuration="(returnFocusSelector: string, defaultTab: string) => emit('show-configuration', returnFocusSelector, defaultTab)"
      />
    </div>
  </SpacedRow>
  <!-- Extensions area -->
  <ExtensionPanel
    class="ppb-3"
    :resource="resource"
    :type="ExtensionPoint.PANEL"
    :location="PanelLocation.DETAIL_TOP"
  />
</template>

<style lang="scss" scoped>
.metadata {
    .labels-and-annotations-empty {
      grid-column: span 2;
    }
}
</style>
