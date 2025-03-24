<script setup lang="ts">
import { StateColor, toBgColor } from '@shell/utils/style';
import BadgeState from '~/pkg/rancher-components/src/components/BadgeState/BadgeState.vue';

export interface Component {
    label?: string;
    color?: StateColor;
}

export interface Props {
    components: Component[];
}

const { components } = defineProps<Props>();
</script>

<template>
  <div class="component-health">
    <span class="mmr-6">Component Health</span>
    <BadgeState
      v-for="(component, i) in components"
      :key="i"
      :color="toBgColor(component.color)"
      :label="component.label"
      class="mmr-3"
    />
  </div>
</template>

<style lang="scss" scoped>
.component-health {
    display: flex;
    flex-direction: row;
    align-items: center;
}
</style>
