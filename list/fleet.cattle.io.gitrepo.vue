<script>
import FleetRepos from '@/components/fleet/FleetRepos';
import Masthead from '@/components/ResourceList/Masthead';
import Loading from '@/components/Loading';
import { FLEET } from '@/config/types';

export default {
  name:       'ListGitRepo',
  components: {
    Loading,
    FleetRepos,
    Masthead,
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    resource: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    const store = this.$store;

    await store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });

    const inStore = store.getters['currentStore'](this.resource);

    this.rows = await store.dispatch(`${ inStore }/findAll`, { type: this.resource });
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-button-label="t('fleet.gitRepo.repo.addRepo')"
    />
    <FleetRepos
      :rows="rows"
      :schema="schema"
    />
  </div>
</template>
