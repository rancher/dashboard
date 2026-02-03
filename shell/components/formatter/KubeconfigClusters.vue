<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
    value: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    clusters() {
      return this.row?.sortedReferencedClusters || [];
    }
  }
};
</script>

<template>
  <span class="kubeconfig-clusters">
    <template
      v-for="(cluster, index) in clusters"
    >
      <template v-if="index > 0">,&nbsp;</template>
      <router-link
        v-if="cluster.location"
        :key="`${row.id}-${cluster.label}`"
        :to="cluster.location"
      >
        {{ cluster.label }}
      </router-link>
      <span
        v-else
        :key="`${row.id}-${cluster.label}-deleted`"
        class="text-muted"
      >
        {{ cluster.label }}
      </span>
    </template>
    <span
      v-if="clusters.length === 0"
      class="text-muted"
    >
      &mdash;
    </span>
  </span>
</template>

<style lang="scss" scoped>
.kubeconfig-clusters {
  display: inline;
}
</style>
