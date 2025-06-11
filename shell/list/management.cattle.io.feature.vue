<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import { MANAGEMENT } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  components: { ResourceTable },
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
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    filteredRows() {
      return this.rows.filter((x) => x.name !== 'fleet');
    },

    enableRowActions() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.FEATURE);

      return schema?.resourceMethods?.includes('PUT');
    },
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  }
};
</script>

<template>
  <div>
    <ResourceTable
      :schema="schema"
      :rows="filteredRows"
      :row-actions="enableRowActions"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    >
      <template #cell:name="scope">
        <div class="feature-name">
          <div>{{ scope.row.nameDisplay }}</div>
          <i
            v-if="scope.row.status.lockedValue !== null"
            class="icon icon-lock"
          />
        </div>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang='scss' scoped>
  .feature-name {
    align-items: center;
    display: flex;

    > i {
      margin-left: 10px;
    }
  }
</style>
