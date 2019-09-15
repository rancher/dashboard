<script>
import ResourceYaml from '@/components/ResourceYaml';
import { FRIENDLY } from '~/pages/rio/_resource/index';

export default {
  components: { ResourceYaml },

  computed: {
    type() {
      return FRIENDLY[this.params.resource].type;
    },

    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    }
  },

  async asyncData(ctx) {
    const { resource, namespace, id } = ctx.params;
    const fqid = `${ namespace }/${ id }`;
    const type = FRIENDLY[resource].type;

    const obj = await ctx.store.dispatch('cluster/find', { type, id: fqid });
    const value = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

    return {
      obj,
      value
    };
  }
};
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" />
  </div>
</template>
