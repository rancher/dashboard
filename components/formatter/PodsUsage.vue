<script>
import { POD } from '@/config/types';
export default {
  name:  'PodsUsage',
  props: {
    clusterId: {
      type:     String,
      default:  '',
      required: true
    },
    totalPods: {
      type:     String,
      default:  '',
      required: true
    },
  },
  data() {
    return { podsUsage: null };
  },
  async fetch() {
    const req = await this.$store.dispatch('management/request', { url: `/k8s/clusters/${ this.clusterId }/v1/counts` });
    const usedPods = req.data?.[0]?.counts[POD]?.summary?.count;

    if (usedPods) {
      this.podsUsage = `${ usedPods }/${ this.totalPods }`;
    }
  }
};
</script>

<template>
  <p>{{ podsUsage }}</p>
</template>

<style lang="scss" scoped>

</style>
