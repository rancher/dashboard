<script>
export { default } from '@/pages/ns/_resource/create.vue';
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" :for-create="true" />
  </div>
</template>
