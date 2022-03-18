<template>
  <li>
    <span class="more-info-item-label">{{ label }}:</span>
    <div class="more-info-item-value">
      <slot name="value"></slot>
    </div>
  </li>
</template>

<script>
export default {
  name:  'InfoBoxItem',
  props: {
    label: {
      type:     String,
      default: ''
    }
  }
};
</script>

<style lang="scss" scoped>
li {
  margin: 0 0 8px 0;
  padding: 0;
  display: flex;
  align-items: top;

  .more-info-item-label {
    color: var(--darker);
    margin-right: 8px;
  }
}
</style>
