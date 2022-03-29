<script>
import { POD } from '@/config/types';
export default {
  name:  'PodsUsage',
  props: {
    row: {
      type:     Object,
      required: true
    },
  },
  data() {
    return { podsUsage: null };
  },
  async fetch() {
    const req = await this.$store.dispatch('management/request', { url: `/k8s/clusters/${ this.row?.id }/v1/counts` });
    const usedPods = req.data?.[0]?.counts[POD]?.summary?.count || 0;
    const totalPods = this.row?.status?.allocatable?.pods;

    if (totalPods) {
      this.podsUsage = `${ usedPods }/${ totalPods }`;
    } else {
      this.podsUsage = '——';
    }
  }
};
</script>

<template>
  <p>{{ podsUsage }}</p>
</template>

<style lang="scss" scoped>

</style>
