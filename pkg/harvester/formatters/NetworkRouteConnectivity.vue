<script>
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';

export default {
  components: { BadgeStateFormatter },
  props:      {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    },

    arbitrary: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {};
  },
};
</script>

<template>
  <div>
    <div v-if="value !== 'N/A'" class="text">
      <BadgeStateFormatter class="ml-10" :arbitrary="arbitrary" :row="row" :value="value" />
    </div>
    <div v-else class="text">
      {{ value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.text {
  text-align: center;
}
</style>
