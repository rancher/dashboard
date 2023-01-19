<script>
// Added by Verrazzano
import CountGauge from '@shell/components/CountGauge';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import Tab from '@shell/components/Tabbed/Tab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import V1WorkloadMetrics from '@shell/mixins/v1-workload-metrics';

import { STATE, NAME, NODE, POD_IMAGES } from '@shell/config/table-headers';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { VZ_COMPONENT } from '@pkg/types';
import { mapGetters } from 'vuex';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'VerrazzanoApplicationDetail',
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
      fetchInProgress:    true,
      namespace:          this.value.metadata?.namespace,
      allPods:            {},
      displayPods:        [],
      allComponents:      {},
      componentResources: null,
      podResources:       null,
    };
  },
  fetch() {
    const self = this;

    this.$fetchType(POD).then((pods) => {
      self.podResources = pods;
    });
    if (this.$store.getters['cluster/schemaFor'](VZ_COMPONENT)) {
      this.$fetchType(VZ_COMPONENT).then((components) => {
        self.componentResources = components;
      });
    }
  },
  computed:   {
    ...mapGetters(['currentCluster']),
    isJob() {
      return this.value.type === WORKLOAD_TYPES.JOB;
    },
    isCronJob() {
      return this.value.type === WORKLOAD_TYPES.CRON_JOB;
    },
    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },
    podTemplateSpec() {
      const isCronJob = this.value.type === WORKLOAD_TYPES.CRON_JOB;

      if ( isCronJob ) {
        return this.value.spec.jobTemplate.spec.template.spec;
      } else {
        return this.value.spec?.template?.spec;
      }
    },
    componentHeaders() {
      return this.$store.getters['type-map/headersFor'](this.componentSchema);
    },
    componentSchema() {
      return this.$store.getters['cluster/schemaFor']('core.oam.dev.component');
    },
    podRestarts() {
      return this.displayPods.reduce((total, pod) => {
        const { status:{ containerStatuses = [] } } = pod;

        if (containerStatuses.length) {
          total += containerStatuses.reduce((tot, container) => {
            tot += container.restartCount;

            return tot;
          }, 0);
        }

        return total;
      }, 0);
    },
    podHeaders() {
      return [
        STATE,
        NAME,
        NODE,
        POD_IMAGES
      ];
    },

    showPodGaugeCircles() {
      const podGauges = Object.values(this.value.podGauges);
      const total = this.displayPods.length;

      return !podGauges.find(pg => pg.count === total);
    },
  },
  methods: {
    resetPods() {
      this.displayPods = this.allPods[this.namespace] || [];
    },
    resetComponents() {
      this.relatedComponents = this.allComponents[this.namespace] || [];
    }
  },
  watch: {
    componentResources() {
      if (this.componentResources) {
        const filteredComponents = this.value?.status?.workloads ? [] : this.componentResources;

        if (this.value?.status?.workloads) {
          this.componentResources.forEach((component) => {
            if (this.value.status.workloads.find(workload => workload.componentName === component.name)) {
              filteredComponents.push(component);
            }
          });
        }

        this.sortObjectsByNamespace(filteredComponents, this.allComponents);
        this.resetComponents();
      }
    },
    podResources() {
      if (this.podResources) {
        const appName = this.value.metadata.name;
        const filteredPods = this.podResources.filter(pod => pod.metadata.labels['app.oam.dev/name'] === appName);

        this.allPods = {};
        this.sortObjectsByNamespace(filteredPods, this.allPods);
        this.resetPods();
      }
    },

    fetchInProgress() {
      this.resetPods();
      this.resetComponents();
    },
    'value.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetPods();
      this.resetComponents();
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3>
      {{ t('verrazzano.common.titles.applicationDetails') }}
    </h3>
    <div v-if="displayPods" class="gauges mb-20" :class="{'gauges__pods': !!displayPods}">
      <template>
        <CountGauge
          v-for="(group, key) in value.podGauges"
          :key="key"
          :total="displayPods.length"
          :useful="group.count || 0"
          :graphical="showPodGaugeCircles"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="key"
        />
      </template>
    </div>
    <ResourceTabs :value="value">
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
      <Tab name="Components">
        <SortableTable
          v-if="relatedComponents"
          :rows="relatedComponents"
          :headers="componentHeaders"
          key-field="id"
          :schema="componentSchema"
          :groupable="false"
          :search="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
