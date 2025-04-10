<script>
export default {
  name: 'Collapse',

  emits: ['update:open'],

  props: {
    open: {
      type:    Boolean,
      default: true
    },

    title: {
      type:    String,
      default: ''
    },

    isDisabled: {
      type:    Boolean,
      default: false
    },
  },

  methods: {
    showAdvanced() {
      this.$emit('update:open', !this.open);
    }
  }
};
</script>

<template>
  <div
    class="collapse"
    :class="{ 'disabled': isDisabled }"
  >
    <slot name="title">
      <div
        class="advanced text-link"
        :class="{ 'disabled': isDisabled }"
        :disabled="isDisabled"
        data-testid="collapse-div"
        @click="showAdvanced"
      >
        <i
          v-if="open"
          class="icon icon-chevron-down"
          data-testid="collapse-icon-down"
        />
        <i
          v-else
          class="icon icon-chevron-right"
          data-testid="collapse-icon-right"
        />
        {{ title }}
      </div>
    </slot>

    <div
      v-if="open"
      class="content"
      data-testid="collapse-content"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.advanced {
  user-select: none;
  cursor: pointer;
  line-height: 40px;
  font-size: 15px;
  font-weight: 500;

  .disabled {
    cursor: not-allowed;
  }
}
.content {
  background: var(--nav-active);
  padding: 10px;
  margin-top: 6px;
  border-radius: 4px;
}
</style>
