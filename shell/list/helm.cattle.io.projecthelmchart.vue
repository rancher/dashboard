<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { Banner } from '@components/Banner';
import { HELM } from '@shell/config/types';

export default {
  components: {
    Loading, ResourceTable, Masthead, Banner
  },
  async fetch() {
    this.projectHelmChartSchema = this.$store.getters['cluster/schemaFor'](HELM.PROJECTHELMCHART);

    this.projectHelmCharts = await this.$store.dispatch('cluster/findAll', { type: HELM.PROJECTHELMCHART } );
    this.pending = false;
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
      resource:                  HELM.PROJECTHELMCHART,
      projectHelmChartSchema:      null,
      projectHelmCharts:           [],
      pending:                   true,
      headers:                null
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
      is-creatable
    />
    <Banner color="info" :label="t('monitoring.projectMonitoring.list.banner')" />
    <Loading v-if="pending" />
    <div v-else>
      <!-- ToDo: figure out how to get this centered in the empty space -->
      <div v-if="projectHelmCharts.length === 0" class="empty-list">
        <div class="message">
          <i class="icon icon-monitoring icon-10x icon-grey"></i>
          <div class="text-large">
            {{ t('monitoring.projectMonitoring.list.empty.message') }}
          </div>
          <div v-if="canCreateProjectHelmChart" class="text-large">
            {{ t('monitoring.projectMonitoring.list.empty.canCreate') }}
          </div>
          <div v-else class="text-large">
            {{ t('monitoring.projectMonitoring.list.empty.cannotCreate') }}
          </div>
        </div>
      </div>
      <div v-else>
        <ResourceTable
          :rows="projectHelmCharts"
          :headers="headers"
          :schema="projectHelmChartSchema"
          key-field="_key"
          :groupable="false"
        />
      </div>
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
