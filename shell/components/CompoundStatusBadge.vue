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
    clickableLink: {
      type:    Object,
      default: () => {}
    }
  },
};
</script>

<template>
  <router-link
    v-if="clickableLink?.name"
    v-clean-tooltip.bottom="tooltipText"
    class="compound-cluster-badge"
    :class="`bg-${badgeClass}`"
    :to="clickableLink"
  >
    <i
      v-if="icon"
      :class="`icon-${icon}`"
    />
    <span>{{ value }}</span>
  </router-link>
  <div
    v-else
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
a.compound-cluster-badge {
    cursor: pointer;
    text-decoration: none;
  }
</style>
