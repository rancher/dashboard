<script setup lang="ts">
import { toRef } from 'vue';
import { RcStatusIndicatorProps } from './types';
import { useStatusColors } from '@components/utils/status';

const props = defineProps<RcStatusIndicatorProps>();

const status = toRef(props, 'status');
const { backgroundColor, borderColor } = useStatusColors(status, 'solid');
</script>

<template>
  <div class="rc-status-indicator">
    <div
      class="shape"
      :class="{[props.shape]: true, [props.status]: true}"
    />
  </div>
</template>

<style lang="scss" scoped>
.rc-status-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 21px;

    .shape {
        display: inline-block;
        border: 1px solid transparent;

        &.disc {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        &.horizontal-bar {
            width: 16px;
            height: 4px;
            border-radius: 2px;
        }

        &.vertical-bar {
            width: 4px;
            height: 16px;
            border-radius: 2px;
        }

        background-color: v-bind(backgroundColor);
        border-color: v-bind(borderColor);
    }
}
</style>
