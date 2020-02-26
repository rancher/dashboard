<script>
import { WORKLOAD, SCHEMA } from '@/config/types';
import { createYaml } from '@/utils/create-yaml';
import Workload from '@/edit/workload';
export default {
  components: { Workload },

  computed:   {
    parentLink() {
      const name = 'c-cluster-workloads';
      const out = this.$router.resolve({ name }).href;

      return out;
    },
  },

  async asyncData(ctx) {
    const asYaml = !!Object.keys(ctx.query).includes('as-yaml');
    const { mode = 'create' } = ctx.query;
    const data = { type: WORKLOAD.DEPLOYMENT };

    const obj = await ctx.store.dispatch('cluster/create', data);
    const schemas = ctx.store.getters['cluster/all'](SCHEMA);

    const yaml = createYaml(schemas, WORKLOAD.DEPLOYMENT, data);

    return {
      obj, type: WORKLOAD.DEPLOYMENT, mode, yaml, asYaml
    };
  }
};
</script>

<template>
  <ResourceYaml v-if="asYaml" :obj="model" :value="yaml" :done-route="doneRoute" :for-create="true" />
  <div v-else>
    <h1 class="mb-20">
      Create <nuxt-link :to="parentLink">
        Workload
      </nuxt-link>
    </h1>
    <Workload :value="obj" :mode="mode" :namespace-suffix-on-create="false" />
  </div>
</template>
