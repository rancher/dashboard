<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/LabeledInput';
import { FRIENDLY } from '~/pages/rio/_resource';

export default {
  components: { LabeledInput },
  mixins:     { CreateEditView },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
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

    const data = { type };

    const model = await ctx.store.dispatch('cluster/create', data);

    return {
      resource,
      type,
      model
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
      :type-label="typeDisplay"
      mode="create"
    />
  </div>
</template>
