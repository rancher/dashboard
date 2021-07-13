<script>
export default {
  props: {
    name: {
      type:     String,
      required: true
    },
    value: {
      type:     [Number, String, Array, undefined],
      default: ''
    },
    mode: {
      type:    String,
      default: 'edit'
    }
  },

  computed: {
    isView() {
      return this.mode === 'view';
    },

    displayValue() {
      if (Array.isArray(this.value) && this.value.length === 0) {
        return '';
      } else {
        return this.value;
      }
    }
  }
};
</script>

<template>
  <div>
    <div v-if="isView" class="label">
      <div class="text-label">
        <slot name="name">
          {{ name }}
        </slot>
      </div>

      <div class="value">
        <slot name="value">
          {{ displayValue }}
        </slot>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<style lang="scss" scoped>
.label {
  display: flex;
  flex-direction: column;

  .value {
    font-size: 14px;
    line-height: 18px;
  }
}
</style>
