<script>
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';

import PolicyList from '../components/policies/PolicyList';

export default {
  components: {
    Banner, Loading, PolicyList
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return { rows: null };
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      class="type-banner mb-20 mt-0"
      color="info"
      :label="t('kubewarden.admissionPolicy.description')"
    />

    <PolicyList :resource="resource" :rows="rows" :schema="schema" />
  </div>
</template>
