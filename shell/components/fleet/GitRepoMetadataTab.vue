<script setup>
import Labels from '@shell/components/form/Labels';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { Banner } from '@components/Banner';

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
  },
  workspaceOptions: {
    type:    Array,
    default: () => []
  },
  workspaceNotice: {
    type:    String,
    default: ''
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
      :mode="mode"
      :rules="{ name: nameRules }"
      namespace-label="nameNsDescription.workspace.label"
      namespace-placeholder="nameNsDescription.workspace.placeholder"
      :namespace-options="workspaceOptions"
      :namespace-create-allowed="false"
      @update:value="updateValue"
    />
    <Banner
      v-if="!isView && workspaceNotice"
      color="info"
      :label="workspaceNotice"
      data-testid="gitrepo-workspace-notice"
    />
    <Labels
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
      :add-icon="'icon-plus'"
    />
  </div>
</template>
