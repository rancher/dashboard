<script>
import { POD } from '@shell/config/types';
export default {
  name:  'PodsUsage',
  props: {
    row: {
      type:     Object,
      required: true
    },
  },
  data() {
    return {
      loading:   true,
      podsUsage: null
    };
  },
  methods: {
    async startDelayedLoading() {
      const id = this.row?.mgmt?.id;

      if (this.row?.isReady && id) {
        const req = await this.$store.dispatch('management/request', { url: `/k8s/clusters/${ id }/v1/counts` });

        this.loading = false;
        const usedPods = req.data?.[0]?.counts[POD]?.summary?.count || 0;
        const totalPods = this.row?.mgmt?.status?.allocatable?.pods;

        if (totalPods) {
          this.podsUsage = `${ usedPods }/${ totalPods }`;
        } else {
          this.podsUsage = '—';
        }
      } else {
        this.loading = false;
        this.podsUsage = '—';
      }
    }
  },
};
</script>

<template>
  <i
    v-if="loading"
    class="icon icon-spinner icon-spin"
  />
  <p v-else>
    {{ podsUsage }}
  </p>
</template>

<style lang="scss" scoped>

</style>
