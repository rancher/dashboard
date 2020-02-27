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
    doneParams() {
      return this.$route.params;
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
  <div>
    <header>
      <h1>
        Create <nuxt-link :to="parentLink">
          Workload
        </nuxt-link>
      </h1>
    </header>
    <Workload :value="obj" :mode="mode" done-route="c-cluster-workloads" :done-params="doneParams" />
  </div>
</template>
