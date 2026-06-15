<script setup>
import Labels from '@shell/components/form/Labels';
import NameNsDescription from '@shell/components/form/NameNsDescription';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  }
});

const emit = defineEmits(['input']);

const updateValue = (event) => {
  emit('input', event);
};
</script>

<template>
  <div>
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :namespaced="false"
      :mode="mode"
      @update:value="updateValue"
    />
    <Labels
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
      :add-icon="'icon-plus'"
    />
  </div>
</template>
