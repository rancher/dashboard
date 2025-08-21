<script setup lang="ts">
import { StateColor, stateColorCssVar } from '@shell/utils/style';
import { computed } from 'vue';

interface Props {
    color: StateColor;
    size?: string;
}

const props = withDefaults(defineProps<Props>(), { size: '8px' });
const backgroundColor = computed(() => stateColorCssVar(props.color));
</script>

<template>
  <span class="state-dot" />
</template>

<style lang="scss" scoped>
.state-dot {
    display: inline-block;

    width: v-bind('props.size');
    height: v-bind('props.size');

    border-radius: 50%;
    background-color: v-bind('backgroundColor');
}
</style>
