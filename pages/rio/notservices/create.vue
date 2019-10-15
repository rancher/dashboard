<script>
import CreateEditView from '@/mixins/create-edit-view';
import { RIO } from '@/config/types';

const RESOURCE = RIO.SERVICE;

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
      return () => import(`@/components/cru/${ this.type }/index.vue`);
    },

    typeDisplay() {
      return 'Service';
    },
  },

  async asyncData(ctx) {
    const schema = ctx.store.getters['cluster/schemaFor'](RESOURCE);

    const metadata = { annotations: {} };

    if ( schema.attributes.namespaced ) {
      metadata.namespace = '';
    }

    const data = {
      kind:       'Service',
      apiVersion: 'rio.cattle.io/v1',
      type:       RESOURCE,
      metadata,
    };

    const model = await ctx.store.dispatch('cluster/create', data);

    return {
      resource: RESOURCE,
      type:     RESOURCE,
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
