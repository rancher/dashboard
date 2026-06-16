<script setup lang="ts">

import Secret from '@shell/detail/secret.vue';
const props = defineProps<{
  value: any;
}>();
</script>

<template>
  <Secret :value="props.value" />
</template>
