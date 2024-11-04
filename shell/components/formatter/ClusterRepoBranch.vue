<script>
export default {
  props: {
    value: { // row
      type:    Object,
      default: () => {}
    },
    col: {
      type:    Object,
      default: () => {}
    }
  },

  computed: {
    clusterRepoBranch() {
      return this.value?.isOciType ? this.t('generic.na') : this.value?.spec?.gitBranch ? this.value.spec.gitBranch : undefined;
    }
  }
};
</script>

<template>
  <span>
    {{ clusterRepoBranch }}
    <template v-if="!clusterRepoBranch && col.dashIfEmpty">
      <span class="text-muted">&mdash;</span>
    </template>
  </span>
</template>
