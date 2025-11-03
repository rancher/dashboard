<script setup lang="ts">
import { RcIconProps, RcIconType, RcIconSize } from '@components/RcIcon/types';
import { computed } from 'vue';
const props = withDefaults(defineProps<RcIconProps>(), { size: 'small' });

const fontSize = computed(() => {
  console.log('ffff', RcIconSize[props.size], RcIconSize, props.size);

  return RcIconSize[props.size];
});

const iconClass = computed(() => {
  return RcIconType[props.type];
});
</script>

<template>
  <i
    class="rc-icon"
    :class="{[props.size]: true, [iconClass]: true}"
  />
</template>

<style lang="scss" scoped>
.rc-icon {
    font-size: v-bind(fontSize);
}
</style>
