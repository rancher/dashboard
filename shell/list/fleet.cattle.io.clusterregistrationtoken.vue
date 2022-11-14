<script>
import { FLEET } from '@shell/config/types';
import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import { isHarvesterCluster } from '@shell/utils/cluster';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListClusterGroup',
  components: { Banner, ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    await this.$fetchType(FLEET.TOKEN);
    this.allFleet = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  data() {
    return { allFleet: [] };
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

      return this.rows.filter((token) => {
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
      return this.rows.length - this.tokens.length;
    }
  },
  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    return {
      loadResources:     [FLEET.TOKEN],
      loadIndeterminate: true, // results are filtered so we wouldn't get the correct count on indicator...
    };
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="hidden"
      color="info"
      :label="t('fleet.tokens.harvester', {count: hidden} )"
    />
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :rows="tokens"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
