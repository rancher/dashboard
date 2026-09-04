<template>
  <div
    :id="contentId"
    class="body active teleport-target"
    role="tabpanel"
  />
</template>

<script setup>
import { onMounted } from 'vue';
import { tabBodyId } from './tab-body';

/**
 * This component serves as a container for the body of a tab within a window manager panel.
 *
 * Props:
 * - id: The unique identifier for the tab.
 * - position: The position of the panel (e.g., left, right, bottom).
 *
 * Behavior:
 * - On mounting, it emits a 'ready' event with the generated content ID for the tab body.
 *   This is necessary for teleporting the tab content to the correct location in the DOM, ONLY when the body container DIV is mounted.
 */
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

const contentId = tabBodyId(props.position, props.id);

onMounted(() => emit('ready', contentId));
</script>
