<script>
export default {
  props: {
    value: {
      type:     Number,
      required: true,
    },
    label: {
      type:    String,
      default: ''
    },
    minusTooltip: {
      type:    String,
      default: null,
    },
    plusTooltip: {
      type:    String,
      default: null,
    },
    min: {
      type:    Number,
      default: 0
    },
    max: {
      type:    Number,
      default: null,
    },
    disabled: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    canMinus() {
      return (this.min !== undefined && this.min !== null) ? this.value > this.min : true;
    },
    canPlus() {
      return (this.max !== undefined && this.max !== null) ? this.value < this.max : true;
    }
  }
};

</script>

<template>
  <div class="plus-minus">
    <span
      v-if="label"
      class="label"
    >{{ label }} </span>
    <button
      v-tooltip="minusTooltip"
      :disabled="disabled || !canMinus"
      type="button"
      class="btn btn-sm role-secondary"
      @click="$emit('minus')"
    >
      <i class="icon icon-sm icon-minus" />
    </button>
    <div class="value">
      {{ value }}
    </div>
    <button
      v-tooltip="plusTooltip"
      :disabled="disabled || !canPlus"
      type="button"
      class="btn btn-sm role-secondary"
      @click="$emit('plus')"
    >
      <i class="icon icon-sm icon-plus" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.plus-minus {
  min-width: 70px;
  display: flex;
  align-items: center;
  button:hover {
    background-color: var(--accent-btn);
  }
  .value {
    min-width: 25px;
    max-width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.label {
  padding-right: 1em;
}
</style>
