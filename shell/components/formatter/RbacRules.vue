<script setup lang="ts">
import { computed } from 'vue';
import type { PolicyRule } from '@shell/types/resources/rbac';

const props = defineProps<{
  value?: PolicyRule[] | null;
}>();

const lines = computed(() => (props.value || []).map((rule) => {
  const groups = (rule.apiGroups || []).filter((group) => !!group);
  const resources = (rule.resources || []).flatMap((resource) => (groups.length ? groups.map((group) => `${ resource }.${ group }`) : [resource]));

  return `${ (rule.verbs || []).join(', ') } ${ resources.join(', ') }`.trim();
}));
</script>

<template>
  <div>
    <div
      v-for="(line, i) in lines"
      :key="i"
    >
      {{ line }}
    </div>
  </div>
</template>
