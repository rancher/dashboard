<script lang="ts">
import KeyValue, { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';

export const extractDefaultAnnotations = (resource: any): Row[] => {
  return [
    {
      key:   'deployment.kubernetes.io/revision',
      value: '1.2.3'
    },
    {
      key:   'meta.helm.sh/release-name',
      value: 'gemini'
    },
    {
      key:   'meta.helm.sh/release-namespace',
      value: 'release-1.2.3'
    },
    {
      key:   'meta.helm.sh/release-name',
      value: 'gemini'
    }
  ];
};

export type Annotation = Row;

export interface AnnotationsProps {
    annotations: Annotation[];
}

</script>

<script setup lang="ts">
const { annotations } = defineProps<AnnotationsProps>();
</script>

<template>
  <KeyValue
    :propertyName="`Annotations`"
    :rows="annotations"
    :maxRows="3"
    :outline="true"
  />
</template>
