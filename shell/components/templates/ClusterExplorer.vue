<script>
import Authenticated from '@shell/components/Authenticated';
import GlobalNavigation from '@shell/components/Navigation/GlobalNavigation';

import ClusterExplorerHeader from '@shell/components/Navigation/Header/ClusterExplorerHeader';
import ClusterContextualNavigation from '@shell/components/Navigation/ContextualNavigation/ClusterNavigation';
import { mapGetters } from 'vuex';
import { applyProducts } from '@shell/store/type-map';

export default {
  components: {
    Authenticated, ClusterContextualNavigation, ClusterExplorerHeader, GlobalNavigation
  },

  computed: { ...mapGetters(['clusterReady']), ...mapGetters({ isAuthenticated: 'auth/isAuthenticated' }) },
  mounted() {
    if (this.clusterReady) {
      this.$emit('clusterReady');
    }
  },

  methods: {
    async load() {
      this.$store.dispatch('loadCluster', {
        id:          this.$route.params.cluster,
        targetRoute: this.$route
      }, { root: true });
      applyProducts(this.$store, this.$plugin);
    }
  },
  watch: {
    clusterReady(value) {
      if (value) {
        this.$emit('clusterReady');
      }
    },
  }
};
</script>
<template>
  <Authenticated @authenticated="load">
    <GlobalNavigation />
    <div
      class="cluster-explorer"
    >
      <div>
        <ClusterExplorerHeader />
      </div>
      <div
        v-if="clusterReady"
        class="resource-explorer"
      >
        <ClusterContextualNavigation />
        <div class="resource">
          <slot />
        </div>
      </div>
    </div>
  </Authenticated>
</template>

<style lang="scss" scoped>
::v-deep {
    .dashboard-root {
        display: flex;
        flex-direction: row;
    }

    .cluster-explorer {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .resource-explorer {
      flex: 1;
      display: flex;
      flex-direction: row;
    }

    .resource {
      padding: 20px;
      min-height: 100%;
      overflow-y: auto;
      flex: 1;
    }
}
</style>
