<script>
import { FLEET } from '@shell/config/types';
import FleetBundleResources from '@shell/components/fleet/FleetBundleResources.vue';
import SortableTable from '@shell/components/SortableTable';

export default {
  name: 'FleetBundleDetail',

  components: {
    FleetBundleResources,
    SortableTable,
  },
  props: {
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

    if (this.hasRepoLabel) {
      this.repo = await this.$store.dispatch('management/find', { type: FLEET.GIT_REPO, id: repoName });
    }
  },

  computed: {
    hasRepoLabel() {
      return !!(this.value?.metadata?.labels && this.value?.metadata?.labels['fleet.cattle.io/repo-name']);
    },
    bundleResources() {
      if (this.hasRepoLabel) {
        const bundleResourceIds = this.bundleResourceIds;

        return this.repo?.status?.resources.filter((resource) => {
          return bundleResourceIds.includes(resource.name);
        });
      } else if (this.value?.spec?.resources?.length) {
        return this.value?.spec?.resources.map((item) => {
          return {
            content: item.content,
            name:    item.name.includes('.') ? item.name.split('.')[0] : item.name
          };
        });
      }

      return [];
    },
    resourceHeaders() {
      return [
        {
          name:     'name',
          value:    'name',
          sort:     ['name'],
          labelKey: 'tableHeaders.name',
        },
      ];
    },
    resourceCount() {
      return (this.bundleResources && this.bundleResources.length) || this.value?.spec?.resources?.length;
    },
    bundleResourceIds() {
      if (this.value.status?.resourceKey) {
        return this.value?.status?.resourceKey.map(item => item.name);
      }

      return [];
    }
  }
};

</script>

<template>
  <div>
    <div class="bundle-title mt-20 mb-20">
      <h2>{{ t('fleet.bundles.resources') }}</h2>
      <span>{{ resourceCount }}</span>
    </div>
    <FleetBundleResources
      v-if="hasRepoLabel"
      :value="bundleResources"
    />
    <SortableTable
      v-else
      :rows="bundleResources"
      :headers="resourceHeaders"
      :table-actions="false"
      :row-actions="false"
      key-field="tableKey"
      default-sort-by="state"
      :paged="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.bundle-title {
  display: flex;
  align-items: center;

  h2 {
    margin: 0 10px 0 0;
  }

  span {
    background-color: var(--darker);
    color: var(--default);
    padding: 5px 10px;
    border-radius: 15px;
  }
}
</style>
