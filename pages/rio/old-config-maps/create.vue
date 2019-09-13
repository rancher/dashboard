<script>
import CreateEditView from '@/mixins/create-edit-view';
import { SCHEMA, CONFIG_MAP } from '@/utils/types';

const RESOURCE = CONFIG_MAP;

export default {
  mixins:     { CreateEditView },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    }
  },

  async asyncData(ctx) {
    const data = { type: RESOURCE };
    const model = await ctx.store.dispatch('v1/create', data);

    return { model };
  }
};
</script>

<template>
  <CruConfigMap
    v-model="model"
    mode="create"
    :done-route="doneRoute"
  />
</template>
