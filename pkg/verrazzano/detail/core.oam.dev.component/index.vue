<script>
// Added by Verrazzano
import CountGauge from '@shell/components/CountGauge';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import Tab from '@shell/components/Tabbed/Tab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import V1WorkloadMetrics from '@shell/mixins/v1-workload-metrics';

import {
  STATE, NAME, NODE, POD_IMAGES, AGE
} from '@shell/config/table-headers';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { VZ_APPLICATION } from '@pkg/types';
import { mapGetters } from 'vuex';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'VerrazzanoComponentDetail',
  components: {
    CountGauge,
    Loading,
    ResourceTabs,
    SortableTable,
    Tab,
  },
  mixins: [VerrazzanoHelper, V1WorkloadMetrics, ResourceFetch],
  data() {
    return {
      fetchInProgress:       true,
      namespace:             this.value.metadata?.namespace,
      allPods:               {},
      displayPods:           [],
      allApplications:       {},
      displayApplications:   [],
      referringApplications: [],
      podResources:          null,
      applicationResources:  null,
    };
  },
  fetch() {
    const self = this;

    this.$fetchType(POD).then((pods) => {
      self.podResources = pods;
    });

    if (this.$store.getters['cluster/schemaFor'](VZ_APPLICATION)) {
      this.$fetchType(VZ_APPLICATION).then((apps) => {
        self.applicationResources = apps;
      });
    }

    this.fetchInProgress = false;
  },
  computed:   {
    ...mapGetters(['currentCluster']),
    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },
    appSchema() {
      return this.$store.getters['cluster/schemaFor']('core.oam.dev.applicationconfiguration');
    },
    podTemplateSpec() {
      const isCronJob = this.value.type === WORKLOAD_TYPES.CRON_JOB;

      if ( isCronJob ) {
        return this.value.spec.jobTemplate.spec.template.spec;
      } else {
        return this.value.spec?.template?.spec;
      }
    },
    podHeaders() {
      return [
        STATE,
        NAME,
        NODE,
        POD_IMAGES
      ];
    },
    appHeaders() {
      return [
        STATE,
        NAME,
        AGE,
      ];
    },
    showPodGaugeCircles() {
      const podGauges = Object.values(this.value.podGauges);
      const total = this.value.pods.length;

      return !podGauges.find(pg => pg.count === total);
    },

  },
  methods: {
    resetPods() {
      this.displayPods = this.allPods[this.namespace] || [];
    },
    resetApplications() {
      this.referringApplications = this.allApplications[this.namespace] || [];
    }
  },
  watch: {
    applicationResources() {
      if (this.applicationResources) {
        const componentName = this.value.metadata.name;
        const filteredApplications = this.applicationResources.filter((app) => {
          return !!app.status.workloads.find(workload => workload.componentName === componentName);
        });

        this.allApplications = {};
        this.sortObjectsByNamespace(filteredApplications, this.allApplications);
        this.resetApplications();
      }
    },
    podResources() {
      if (this.podResources) {
        const componentName = this.value.metadata.name;
        const filteredPods = this.podResources.filter(pod => pod.metadata.labels['app.oam.dev/component'] === componentName);

        this.allPods = {};
        this.sortObjectsByNamespace(filteredPods, this.allPods);
        this.resetPods();
      }
    },
    fetchInProgress() {
      this.resetPods();
      this.resetApplications();
    },
    'value.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetPods();
      this.resetApplications();
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3>
      {{ t('verrazzano.common.titles.componentDetails') }}
    </h3>
    <div v-if="value.pods || value.jobGauges" class="gauges mb-20" :class="{'gauges__pods': !!value.pods}">
      <template v-if="value.jobGauges">
        <CountGauge
          v-for="(group, key) in value.jobGauges"
          :key="key"
          :total="value.pods.length"
          :useful="group.count || 0"
          :graphical="showJobGaugeCircles"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="t(`workload.gaugeStates.${key}`)"
        />
      </template>
      <template v-else>
        <CountGauge
          v-for="(group, key) in value.podGauges"
          :key="key"
          :total="value.pods.length"
          :useful="group.count || 0"
          :graphical="showPodGaugeCircles"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="key"
        />
      </template>
    </div>
    <ResourceTabs :value="value">
      <div>
        <Tab name="pods" :label="t('tableHeaders.pods')" :weight="4">
          <SortableTable
            v-if="displayPods"
            :rows="displayPods"
            :headers="podHeaders"
            key-field="id"
            :schema="podSchema"
            :groupable="false"
            :search="false"
          />
        </Tab>
        <Tab name="apps" :label="t('verrazzano.common.tabs.referringApplications')" :weight="3">
          <SortableTable
            v-if="referringApplications"
            :rows="referringApplications"
            :headers="appHeaders"
            key-field="id"
            :schema="appSchema"
            :groupable="false"
            :search="false"
          />
        </Tab>
      </div>
    </ResourceTabs>
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
