<script>
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { Banner } from '@components/Banner';
import { HELM } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  components: {
    ResourceTable, Masthead, Banner
  },
  mixins: [ResourceFetch],
  props:  {
    resource: {
      type:     String,
      required: true,
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    this.projectHelmChartSchema = this.$store.getters['cluster/schemaFor'](HELM.PROJECTHELMCHART);
    await this.$fetchType(HELM.PROJECTHELMCHART);

    this.$store.dispatch('type-map/configureType', { match: HELM.PROJECTHELMCHART, isCreatable: true });
    this.headers = this.$store.getters['type-map/headersFor'](this.projectHelmChartSchema).map((header) => {
      if (header.name === 'name') {
        return {
          ...header, value: 'projectDisplayName', labelKey: 'tableHeaders.project'
        };
      }
      if (header.name === 'namespace') {
        return { ...header, labelKey: 'tableHeaders.registrationNamespace' };
      }

      return { ...header };
    }).filter(header => header.name !== 'system namespace');
  },
  data() {
    return {
      projectHelmChartSchema: null,
      headers:                null,
    };
  },
  computed: {
    canCreateProjectHelmChart() {
      return !!(this?.projectHelmChartSchema?.collectionMethods || []).find(method => method.toLowerCase() === 'post');
    }

  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="projectHelmChartSchema"
      :resource="resource"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
      :is-creatable="canCreateProjectHelmChart"
    />
    <Banner
      color="info"
      :label="t('monitoring.projectMonitoring.list.banner')"
    />
    <!-- ToDo: figure out how to get this centered in the empty space -->
    <div
      v-if="rows.length === 0 && !loading"
      class="empty-list"
    >
      <div class="message">
        <i class="icon icon-monitoring icon-10x icon-grey" />
        <div class="text-large">
          {{ t('monitoring.projectMonitoring.list.empty.message') }}
        </div>
        <div
          v-if="canCreateProjectHelmChart"
          class="text-large"
        >
          {{ t('monitoring.projectMonitoring.list.empty.canCreate') }}
        </div>
        <div
          v-else
          class="text-large"
        >
          {{ t('monitoring.projectMonitoring.list.empty.cannotCreate') }}
        </div>
      </div>
    </div>
    <div v-else>
      <ResourceTable
        :rows="rows"
        :headers="headers"
        :schema="projectHelmChartSchema"
        :loading="loading"
        :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
        key-field="_key"
        :groupable="false"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.header{
  display: flex;
  H1{
    flex: 1;
  }
}

.empty-list {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-top: 6em;
  min-height: 100%;

  .message {
    display:flex;
    flex-direction: column;
    align-items: center;
    margin-top: -5em;

    .icon-10x {
      font-size: 10em;
    }

    .icon-grey {
      color: var(--darker);
    }

    .text-large {
      font-size: 1.2em;
      padding: 0.5em;
    }
  }
}
</style>
