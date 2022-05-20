<script>
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    hasBadge() {
      return !!this.cluster?.badge;
    }
  }
};
</script>

<template>
  <div v-if="hasBadge" :style="{ backgroundColor: cluster.badge.color, color: cluster.badge.textColor }" class="cluster-badge">
    {{ cluster.badge.text }}
  </div>
</template>

<style lang="scss" scoped>
  .cluster-badge {
    cursor: default;
    border-radius: 10px;
    font-size: 12px;
    padding: 2px 10px;
    max-width: 250px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
