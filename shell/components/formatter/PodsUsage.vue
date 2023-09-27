<script>
export default {
  name:  'PodsUsage',
  props: {
    row: {
      type:     Object,
      required: true
    },
  },
  computed: {
    ready() {
      return this.row?.isReady;
    },
    podsUsage() {
      const usedPods = this.row?.mgmt?.status?.requested?.pods;
      const totalPods = this.row?.mgmt?.status?.allocatable?.pods;

      return totalPods ? `${ usedPods || 0 }/${ totalPods }` : '—';
    }
  }
};
</script>

<template>
  <i
    v-if="!ready"
    class="icon icon-spinner icon-spin"
  />
  <p v-else>
    <span>{{ podsUsage }}</span>
  </p>
</template>
