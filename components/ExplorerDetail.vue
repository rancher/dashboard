<script>
import { WORKLOAD } from '../config/types';
import ResourceYaml from '@/components/ResourceYaml';
import Workload from '@/edit/workload';

export async function asyncData(ctx) {
  const { resource, namespace, id } = ctx.params;

  const fqid = (namespace ? `${ namespace }/` : '') + id;

  const obj = await ctx.store.dispatch('cluster/find', { type: resource, id: fqid });
  const value = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

  // check if resource is 'workload' and load that component instead of kubernetes type-specific component
  const workloadTypes = Object.values(WORKLOAD);

  if (workloadTypes.includes(resource)) {
    return { isWorkload: true, obj };
  }

  return {
    obj,
    value: value.data
  };
}

export default {
  components: { ResourceYaml, Workload },

  props: {
    asyncData: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return { ...this.asyncData };
  },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    },
  },
};
</script>

<template>
  <div v-if="isWorkload">
    <Workload :value="obj" />
  </div>
  <div v-else>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" />
  </div>
</template>
