<script>
export default {
  props: {
    icon: {
      type:    String,
      default: ''
    },
    text: {
      type:    String,
      default: ''
    }
  }
};
</script>

<template>
  <div class="tip">
    <span class="my-icon" :class="icon"></span>
    <slot>
      <span class="text">{{ text }}</span>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
.tip {
  color: var(--disabled-text);
  display: flex;
  align-items: center;
}

.my-icon {
  font-size: 16px;
  margin-right: 2px;
}

.text {
  font-size: 14px;
}
</style>
