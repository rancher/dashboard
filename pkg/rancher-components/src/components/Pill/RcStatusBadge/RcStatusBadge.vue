<script setup lang="ts">
import { toRef } from 'vue';
import { RcStatusBadgeProps } from './types';
import { useStatusColors } from '@components/utils/status';

const props = defineProps<RcStatusBadgeProps>();

const status = toRef(props, 'status');
const { backgroundColor, borderColor, textColor } = useStatusColors(status, 'outlined');
</script>

<template>
  <div
    class="rc-status-badge"
    :class="{[props.status]: true}"
  >
    <slot name="default" />
  </div>
</template>

<style lang="scss" scoped>
.rc-status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 7px;

    border: 1px solid transparent;
    border-radius: 30px;

    font-family: Lato;
    font-size: 12px;
    line-height: 19px;

    background-color: v-bind(backgroundColor);
    border-color: v-bind(borderColor);
    color: v-bind(textColor);
}
</style>
