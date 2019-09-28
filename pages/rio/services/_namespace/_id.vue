<script>
import ResourceYaml from '@/components/ResourceYaml';
import { RIO } from '@/config/types';

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    }
  },

  async asyncData(ctx) {
    const { namespace, id } = ctx.params;
    const fqid = `${ namespace }/${ id }`;

    const obj = await ctx.store.dispatch('cluster/find', { type: RIO.APP, id: fqid });
    const value = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

    return {
      obj,
      value: value.data
    };
  }
};
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" />
  </div>
</template>
