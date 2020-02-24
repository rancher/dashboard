<script>
import Workload from '@/edit/workload';
export default {
  components: { Workload },

  computed:   {
    parentLink() {
      const name = 'c-cluster-workloads';
      //   const params = this.$route.params;
      const out = this.$router.resolve({ name }).href;

      return out;
    },
  },

  async asyncData(ctx) {
    const { resource } = ctx.params;
    const { mode = 'create' } = ctx.query;
    const data = { type: resource };
    let value;

    const obj = await ctx.store.dispatch('cluster/create', data);
    const type = obj.type;

    return {
      obj, value, type, mode
    };
  }
};
</script>

<template>
  <div>
    <h1 class="mb-20">
      Create <nuxt-link :to="parentLink">
        Workload
      </nuxt-link>
    </h1>
    <Workload :value="obj" :mode="mode" />
  </div>
</template>
