<script>
import { ALL_TYPES } from '@/components/form/SuperDatePicker/util';

export default {
  props: {
    value: {
      type:     Object,
      required: true
    },
  },

  methods:  {
    setNow() {
      this.$set(this.value, 'type', ALL_TYPES.NOW.key);
    }
  },
};
</script>

<template>
  <div class="absolute">
    <button class="btn role-primary" @click="setNow">
      Set the date and time to now
    </button>
  </div>
</template>

<style lang="scss" scoped>
button {
  width: 100%;
}
</style>
