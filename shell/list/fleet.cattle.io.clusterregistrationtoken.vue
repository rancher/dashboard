<script>
import { FLEET } from '@shell/config/types';
import Banner from '@shell/components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import { isHarvesterCluster } from '@shell/utils/cluster';

export default {
  name:       'ListClusterGroup',
  components: {
    Banner, Loading, ResourceTable
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.allTokens = await this.$store.dispatch('management/findAll', { type: FLEET.TOKEN });
    this.allFleet = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  data() {
    return {
      allFleet:  null,
      allTokens: null,
    };
  },

  computed: {
    harvesterClusters() {
      const harvester = {};

      this.allFleet.forEach((c) => {
        if (isHarvesterCluster(c)) {
          harvester[c.metadata.uid] = c;
        }
      });

      return harvester;
    },
    tokens() {
      const harvester = this.harvesterClusters;

      return this.allTokens.filter((token) => {
        const refs = token.metadata?.ownerReferences || [];

        for (const owner of refs) {
          if (harvester[owner.uid]) {
            return false;
          }
        }

        return true;
      });
    },

    hidden() {
      return this.allTokens.length - this.tokens.length;
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <Banner v-if="hidden" color="info" :label="t('fleet.tokens.harvester', {count: hidden} )" />
      <ResourceTable
        v-bind="$attrs"
        :schema="schema"
        :rows="tokens"
      >
      </ResourceTable>
    </div>
  </div>
</template>
