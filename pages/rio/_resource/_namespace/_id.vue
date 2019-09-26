<script>
import CreateEditView from '@/mixins/create-edit-view';
import { FRIENDLY } from '~/pages/rio/_resource/index';

export default {
  mixins:   { CreateEditView },

  computed: {
    type() {
      return FRIENDLY[this.resource].type;
    },

    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    },

    doneParams() {
      return this.$route.params;
    },

    cruComponent() {
      return () => import(`@/components/cru/${ this.type }`);
    },

    typeDisplay() {
      return FRIENDLY[this.resource].singular;
    },

  },

  async asyncData(ctx) {
    const { resource, namespace, id } = ctx.params;
    const fqid = `${ namespace }/${ id }`;
    const type = FRIENDLY[resource].type;

    const obj = await ctx.store.dispatch('cluster/find', { type, id: fqid });

    const model = await ctx.store.dispatch('cluster/clone', obj);

    return {
      resource,
      model,
      originalModel: obj,
    };
  }
};
</script>

<template>
  <div>
    <header>
      <h1>Create {{ typeDisplay }}</h1>
    </header>
    <component
      :is="cruComponent"
      v-model="model"
      :original-value="originalModel"
      :done-route="doneRoute"
      :done-params="doneParams"
      :namespace-suffix-on-create="true"
      :type-label="typeDisplay"
      mode="create"
    />
  </div>
</template>
