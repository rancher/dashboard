<script>
import { FLEET } from '@/config/types';
import FleetBundleResources from '@/components/fleet/FleetBundleResources.vue';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import FleetResources from '~/components/fleet/FleetResources.vue';

export default {
  name: 'FleetBundleDetail',

  components: {
    Tabbed,
    Tab,
    FleetBundleResources,
    FleetResources
  },
  props:      {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return { repo: null };
  },

  async fetch() {
    const { namespace, labels } = this.value.metadata;
    const repoName = `${ namespace }/${ labels['fleet.cattle.io/repo-name'] }`;

    this.repo = await this.$store.dispatch('management/find', { type: FLEET.GIT_REPO, id: repoName });
  },

  computed: {

    bundleResources() {
      const bundleResourceIds = this.bundleResourceIds;

      return this.repo?.status?.resources.filter((resource) => {
        return bundleResourceIds.includes(resource.name);
      });
    },

    bundleResourceIds() {
      return this.value.status.resourceKey.map(item => item.name);
    },

    repoSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.GIT_REPO);
    },
  }
};

</script>

<template>
  <div>
    <Tabbed>
      <Tab label="Resources" name="resources" :weight="30">
        <FleetResources :value="repo" />
      </Tab>
    </Tabbed>
  </div>
</template>
