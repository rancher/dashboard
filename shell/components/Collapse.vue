<script>
export default {
  name:  'Collapse',
  props: {
    open: {
      type:    Boolean,
      default: true
    },

    title: {
      type:     String,
      default:  ''
    }
  },

  methods: {
    showAdvanced() {
      this.$emit('update:open', !this.open);
    }
  }
};
</script>

<template>
  <div class="collapse">
    <slot name="title">
      <div class="advanced text-link" @click="showAdvanced">
        <i v-if="open" class="icon icon-chevron-down"></i>
        <i v-else class="icon icon-chevron-right"></i>
        {{ title }}
      </div>
    </slot>

    <div v-if="open" class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.advanced {
  user-select: none;
  padding: 0 5px;
  cursor: pointer;
  line-height: 40px;
  font-size: 15px;
  font-weight: 500;
}
.content {
  background: var(--nav-active);
  padding: 10px;
  margin-top: 6px;
  border-radius: 4px;
}
</style>
