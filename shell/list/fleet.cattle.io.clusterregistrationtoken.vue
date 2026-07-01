<script>
import { FLEET, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { CAPI } from '@shell/config/labels-annotations';
import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import { isHarvesterCluster } from '@shell/utils/cluster';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { HARVESTER_CONTAINER } from '@shell/store/features';

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
    await this.$fetchType(this.resource);

    // Clusters are only needed to hide Harvester-owned tokens. When Harvester hosts are visible we
    // don't filter at all, so skip the fetch entirely; otherwise fetch ONLY the Harvester clusters
    // (server-side, by the provider label) rather than every cluster.
    const harvesterVisible = this.$store.getters['features/get'](HARVESTER_CONTAINER);

    if (!harvesterVisible && this.$store.getters['management/schemaFor']( FLEET.CLUSTER )) {
      try {
        this.allFleet = await this.$store.dispatch('management/findLabelSelector', {
          type:     FLEET.CLUSTER,
          matching: { labelSelector: { matchLabels: { [CAPI.PROVIDER]: VIRTUAL_HARVESTER_PROVIDER } } },
        }) || [];
      } catch (e) {
        this.allFleet = [];
      }
    }
  },

  data() {
    return { allFleet: [] };
  },

  mounted() {
    this.areHarvesterHostsVisible = this.$store.getters['features/get'](HARVESTER_CONTAINER);
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

      if (this.areHarvesterHostsVisible) {
        return this.rows;
      }

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
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
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
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
</template>
