<script>
export default {
  name:  'CompoundStatusBadge',
  props: {
    tooltipText: {
      type:    String,
      default: ''
    },
    badgeClass: {
      type:    String,
      default: ''
    },
    icon: {
      type:    String,
      default: ''
    },
    value: {
      type:    String,
      default: ''
    },
  },
};
</script>

<template>
  <div
    v-clean-tooltip.bottom="tooltipText"
    class="compound-cluster-badge"
    :class="`bg-${badgeClass}`"
  >
    <i
      v-if="icon"
      :class="`icon-${icon}`"
    />
    <span>{{ value }}</span>
  </div>
</template>

<style lang="scss" scoped>
.compound-cluster-badge {
  padding: 4px 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  width: fit-content;
  cursor: default;

  i {
    font-size: 16px;
    margin-right: 6px;
  }
}
</style>
