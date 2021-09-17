<script>
export default {
  props: {
    name: {
      type:     String,
      required: true
    },
    value: {
      type:     [Number, String, undefined],
      default: ''
    }
  }
};
</script>

<template>
  <div class="label">
    <div class="text-label">
      <slot name="name">
        {{ name }}
      </slot>
    </div>

    <div class="value">
      <slot name="value">
        {{ value }}
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.label {
  display: flex;
  flex-direction: column;

  .value {
    font-size: 14px;
    line-height: $input-line-height;
  }
}
</style>
