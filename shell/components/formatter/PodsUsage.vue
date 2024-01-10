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
    podsUsage() {
      const usedPods = this.row?.mgmt?.status?.requested?.pods;
      const totalPods = this.row?.mgmt?.status?.allocatable?.pods;

      if (!this.row?.isReady || !totalPods) {
        return '—';
      }

      return `${ usedPods || 0 }/${ totalPods }`;
    }
  }
};
</script>

<template>
  <p>
    <span>{{ podsUsage }}</span>
  </p>
</template>
