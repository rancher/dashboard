<script>
import { RcButton } from '@components/RcButton';

/**
 * The Explore column: the button through to a cluster, disabled when it cannot be explored.
 *
 * Lived in the cluster list's own `cell:explorer` slot, and the column carries no value of its
 * own, so on any other list it rendered nothing at all.
 */
export default {
  name: 'ClusterExplore',

  components: { RcButton },

  props: {
    row: {
      type:     Object,
      required: true
    }
  },

  computed: {
    canExplore() {
      return !!this.row?.canExplore;
    },

    to() {
      return { name: 'c-cluster', params: { cluster: this.row?.id } };
    }
  }
};
</script>

<template>
  <rc-button
    v-if="canExplore"
    variant="secondary"
    data-testid="cluster-manager-list-explore-management"
    :to="to"
  >
    {{ t('cluster.explore') }}
  </rc-button>
  <rc-button
    v-else
    variant="secondary"
    data-testid="cluster-manager-list-explore"
    :disabled="true"
  >
    {{ t('cluster.explore') }}
  </rc-button>
</template>
