<script>
import ResourceYaml from '@/components/ResourceYaml';

export async function asyncData(ctx) {
  const { resource, namespace, id } = ctx.params;
  const fqid = (namespace ? `${ namespace }/` : '') + id;

  const obj = await ctx.store.dispatch('cluster/find', { type: resource, id: fqid });
  const value = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

  return {
    obj,
    value: value.data
  };
}

export default {
  components: { ResourceYaml },

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
    }
  },
};
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" />
  </div>
</template>
