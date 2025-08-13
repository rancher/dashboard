<script setup lang="ts">
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import { RcCounterBadgeProps } from '@components/Pill/RcCounterBadge/types';
import { computed } from 'vue';

const props = withDefaults(defineProps<RcCounterBadgeProps>(), { disabled: false });
const displayCount = computed(() => props.count < 1000 ? props.count : '999+');
</script>

<template>
  <RcTag
    class="rc-counter-badge"
    :type="props.type"
    :disabled="props.disabled"
  >
    {{ displayCount }}
  </RcTag>
</template>

<style lang="scss" scoped>
.rc-counter-badge {
  :deep() {
    border-radius: 30px;
  }
}
</style>
