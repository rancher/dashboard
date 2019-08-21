<script>
import ResourceYaml from '@/components/ResourceYaml';

export default {
  components: { ResourceYaml },

  async asyncData(ctx) {
    const { resource, namespace, id } = ctx.params;
    const fqid = (namespace ? `${ namespace }/` : '') + id;

    const obj = await ctx.store.dispatch('v1/find', { type: resource, id: fqid });
    const value = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

    return {
      obj,
      value
    };
  },
};
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" />
  </div>
</template>
