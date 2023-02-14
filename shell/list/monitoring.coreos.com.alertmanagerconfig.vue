<script>
import ResourceTable from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
import ResourceFetch from '@shell/mixins/resource-fetch';
export default {
  name:       'ListApps',
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
  }
};
</script>

<template>
  <div v-if="rows.length || loading">
    <Banner color="info">
      {{ t('monitoring.alertmanagerConfig.description') }}
    </Banner>
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>

  <div
    v-else
    class="empty"
  >
    <i class="icon icon-monitoring mb-10" />
    <h2>{{ t('monitoring.alertmanagerConfig.empty') }}</h2>
    <h3 class="mb-30">
      {{ t('monitoring.alertmanagerConfig.getStarted') }}
    </h3>
  </div>
</template>

<style lang="scss" scoped>
.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 6em;
  min-height: 100%;
}

i {
  font-size: 10em;
  opacity: 50%;
  margin: 0;
}

h2 {
  margin: 0;
}

h3 {
  margin-top: 2em;
}

</style>
