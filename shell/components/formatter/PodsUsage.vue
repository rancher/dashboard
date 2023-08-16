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

      return totalPods ? `${ usedPods }/${ totalPods }` : '—';
    }
  }
};
</script>

<template>
  <p>{{ podsUsage }}</p>
</template>
