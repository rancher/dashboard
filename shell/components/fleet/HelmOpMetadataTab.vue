<script setup>
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Labels from '@shell/components/form/Labels';

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
  },
  nameRules: {
    type:    Array,
    default: () => []
  }
});

const emit = defineEmits(['update:value']);

const updateValue = (value) => {
  emit('update:value', value);
};
</script>

<template>
  <div>
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :namespaced="false"
      :mode="mode"
      :rules="{ name: nameRules }"
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

<style lang="scss" scoped>
</style>
