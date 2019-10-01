<script>
import CreateEditView from '@/mixins/create-edit-view';
import { FRIENDLY } from '~/pages/rio/_resource';

export default {
  mixins: { CreateEditView },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

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
    const { resource } = ctx.params;
    const type = FRIENDLY[resource].type;

    const schema = ctx.store.getters['cluster/schemaFor'](type);

    const metadata = { anotations: {} };

    if ( schema.attributes.namespaced ) {
      metadata.namespace = '';
    }

    const data = {
      type,
      metadata,
      data: {},
    };

    const model = await ctx.store.dispatch('cluster/create', data);

    return {
      resource,
      type,
      model,
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
      :done-route="doneRoute"
      :done-params="doneParams"
      :namespace-suffix-on-create="true"
      :type-label="typeDisplay"
      mode="create"
    />
  </div>
</template>
