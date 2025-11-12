<script setup lang="ts">
import { RcIconProps, RcIconSize, RcIconTypeToClass } from '@components/RcIcon/types';
import { computed } from 'vue';
import { StatusObject, useStatusColors } from '../../utils/status';
const props = withDefaults(defineProps<RcIconProps>(), { size: 'small', status: 'inherit' });

const fontSize = computed(() => {
  return RcIconSize[props.size];
});

const iconClass = computed(() => {
  return RcIconTypeToClass[props.type];
});

const color = computed(() => {
  if (props.status && props.status === 'inherit') {
    return 'inherit';
  }

  return useStatusColors(props as StatusObject, 'outlined').textColor.value;
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
  color: v-bind(color);
}
</style>
