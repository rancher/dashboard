<script lang="ts">
import KeyValue, { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';

export const extractDefaultLabels = (resource: any): Row[] => {
  return [{
    key:   'beta.kubernetes.io/arch',
    value: 'amd64'
  },
  {
    key:   'beta.kubernetes.io/instance-type',
    value: 't2.medium'
  },
  {
    key:   'beta.kubernetes.io/os',
    value: 'linux'
  },
  {
    key:   'eks.amazonaws.com/capacityType',
    value: 'ON_DEMAND'
  }];
};

export type Label = Row;

export interface LabelsProps {
    labels: Label[];
}

</script>

<script setup lang="ts">
const { labels } = defineProps<LabelsProps>();
</script>

<template>
  <KeyValue
    :propertyName="`Labels`"
    :rows="labels"
    :maxRows="3"
  />
</template>
