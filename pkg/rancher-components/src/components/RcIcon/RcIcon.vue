<script setup lang="ts">
import { RcIconProps, RcIconSize, RcIconTypeToClass } from '@components/RcIcon/types';
import { computed } from 'vue';
import { useStatusColors } from '@components/utils/status';
const props = withDefaults(defineProps<RcIconProps>(), {
  size: 'small', ariaHidden: true, status: 'inherit'
});

const fontSize = computed(() => {
  return RcIconSize[props.size];
});

const iconClass = computed(() => {
  return RcIconTypeToClass[props.type];
});

const color = computed(() => {
  if (props.status === 'inherit') {
    return 'inherit';
  }

  const statusColors = useStatusColors({ status: props.status }, 'outlined');

  return statusColors.textColor.value;
});
</script>

<template>
  <i
    class="rc-icon"
    :class="[props.size, iconClass]"
    :aria-hidden="props.ariaHidden"
  />
</template>

<style lang="scss" scoped>
.rc-icon {
  font-size: v-bind(fontSize);
  color: v-bind(color);
}
</style>
