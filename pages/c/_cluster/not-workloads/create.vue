<script>
import { WORKLOAD_TYPES, SCHEMA } from '@/config/types';
import { createYaml } from '@/utils/create-yaml';
import Workload from '@/edit/workload';
export default {
  components: { Workload },

  computed:   {
    doneParams() {
      return this.$route.params;
    },
  },

  async asyncData(ctx) {
    const asYaml = !!Object.keys(ctx.query).includes('as-yaml');
    const { mode = 'create' } = ctx.query;
    const data = { type: WORKLOAD_TYPES.DEPLOYMENT };

    const obj = await ctx.store.dispatch('cluster/create', data);
    const schemas = ctx.store.getters['cluster/all'](SCHEMA);

    const yaml = createYaml(schemas, WORKLOAD_TYPES.DEPLOYMENT, data);

    return {
      obj, type: WORKLOAD_TYPES.DEPLOYMENT, mode, yaml, asYaml
    };
  }
};
</script>

<template>
  <div>
    <header>
      <h1>
        OLD Create Workload
      </h1>
    </header>
    <Workload :value="obj" :mode="mode" done-route="c-cluster-workloads" :done-params="doneParams" />
  </div>
</template>
