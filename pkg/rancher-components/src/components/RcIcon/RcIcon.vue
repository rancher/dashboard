<script setup lang="ts">
import { RcIconSizeToCSS, RcIconTypeToClass, RcIconProps } from './types';
import { computed } from 'vue';
import { useStatusColors } from '@components/utils/status';

const props = withDefaults(defineProps<RcIconProps>(), {
  size: 'small', ariaHidden: true, status: 'inherit'
});
const fontSize = computed(() => {
  return RcIconSizeToCSS[props.size];
});

const iconClass = computed(() => {
  return RcIconTypeToClass[props.type];
});

const status = computed(() => {
  if (props.status && props.status !== 'inherit') {
    return props.status;
  }

  return 'none';
});

const { textColor } = useStatusColors(status, 'outlined');

const color = computed(() => {
  if (props.status === undefined || props.status === 'inherit') {
    return 'inherit';
  }

  return textColor.value;
});
</script>

<template>
  <i
    class="rc-icon"
    :class="{[props.size]: true, [iconClass]: true}"
    :aria-hidden="props.ariaHidden"
  />
</template>

<style lang="scss" scoped>
.rc-icon {
  font-size: v-bind(fontSize);
  color: v-bind(color);
}
</style>
