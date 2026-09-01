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
      return !!this.cluster?.badge?.text;
    },
    showBorders() {
      return this.cluster?.badge?.color === 'transparent';
    },
  }
};
</script>

<template>
  <div
    v-if="hasBadge"
    :style="{ backgroundColor: cluster.badge.color, color: cluster.badge.textColor }"
    class="cluster-badge"
    :class="{'cluster-badge-border': showBorders}"
    :aria-label="t('clusterBadge.clusterComment', { text: cluster.badge?.text || '' })"
  >
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

     &-border {
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--body-text) !important; // !important is needed to override the color set by the badge when there's a transparent background.
    }
  }
</style>
