<template>
  <div
    :id="contentId"
    class="body active teleport-target"
    role="tabpanel"
  />
</template>

<script setup>
import { onMounted, defineProps, defineEmits } from 'vue';

const props = defineProps({
  id: {
    type:     String,
    required: true
  },
  position: {
    type:     String,
    required: true
  }
});

const emit = defineEmits(['ready']);

const contentId = `wm-panel-body-${ props.position }-${ props.id.replace(/[^a-zA-Z0-9_-]/g, '-') }`;

onMounted(() => emit('ready', contentId));
</script>
