<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    originalValue: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
});
</script>

<template>
  <div>
    DETAIL
    Debug<br>
    Mode: {{ mode }}<br>
    Value: {{ JSON.stringify(value) }}<br>
    originalValue: {{ JSON.stringify(originalValue) }}<br>
  </div>
</template>
