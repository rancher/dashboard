<script>
import createEditView from '@/mixins/create-edit-view';
import { STATE, NAME, NODE, POD_IMAGES } from '@/config/table-headers';
import { POD, WORKLOAD_TYPES } from '@/config/types';
import ResourceTable from '@/components/ResourceTable';
import WorkloadPorts from '@/components/form/WorkloadPorts';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Command from '@/components/form/Command';
import NodeScheduling from '@/components/form/NodeScheduling';
import PodScheduling from '@/components/form/PodScheduling';
import HealthCheck from '@/components/form/HealthCheck';
import Security from '@/components/form/Security';
import Upgrading from '@/edit/workload/Upgrading';
import Networking from '@/components/form/Networking';
import Job from '@/edit/workload/Job';

import { mapGetters } from 'vuex';

export default {
  components: {
    ResourceTable,
    WorkloadPorts,
    Command,
    PodScheduling,
    NodeScheduling,
    Upgrading,
    Networking,
    Security,
    HealthCheck,
    Job,
    Tabbed,
    Tab
  },

  mixins: [createEditView],

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'view'
    }
  },

  async fetch() {
    let pods;
    const { metadata:{ relationships = [] } } = this.value;
    const podRelationship = relationships.filter(relationship => relationship.toType === POD)[0];

    if (podRelationship) {
      pods = await this.$store.dispatch('cluster/findMatching', { type: POD, selector: podRelationship.selector });
    }

    this.pods = pods;
  },

  data() {
    const podHeaders = [STATE, NAME, POD_IMAGES, NODE];

    const isCronJob = this.value.type === WORKLOAD_TYPES.CRON_JOB;

    const podTemplateSpec = isCronJob ? this.value.spec.jobTemplate.spec.template.spec : this.value.spec?.template?.spec;

    const container = podTemplateSpec.containers[0];

    const name = this.value?.metadata?.name || this.value.id;

    const podSchema = this.$store.getters['cluster/schemaFor'](POD);

    return {
      type:           this.value.type,
      podSchema,
      name,
      podHeaders,
      pods:           [],
      container,
      podTemplateSpec
    };
  },

  computed:   {
    podRestarts() {
      return this.pods.reduce((total, pod) => {
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

    isJob() {
      return this.type === WORKLOAD_TYPES.JOB;
    },

    isCronJob() {
      return this.type === WORKLOAD_TYPES.CRON_JOB;
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <div>
    <Tabbed :side-tabs="true">
      <Tab :label="t('workload.container.titles.ports')" name="ports">
        <WorkloadPorts :value="container.ports" mode="view" />
      </Tab>
      <Tab :label="t('workload.container.titles.command')" name="command">
        <Command v-model="container" :mode="mode" />
      </Tab>
      <Tab :label="t('workload.container.titles.podScheduling')" name="podScheduling">
        <PodScheduling :mode="mode" :value="podTemplateSpec" />
      </Tab>
      <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling">
        <NodeScheduling :mode="mode" :value="podTemplateSpec" />
      </Tab>
      <Tab label="Scaling/Upgrade Policy" name="upgrading">
        <Job v-if="isJob || isCronJob" :value="value.spec" :mode="mode" :type="type" />
        <Upgrading v-else :value="value.spec" :mode="mode" :type="type" />
      </Tab>
      <Tab :label="t('workload.container.titles.healthCheck')" name="healthCheck">
        <HealthCheck :value="container" :mode="mode" />
      </Tab>
      <Tab :label="t('workload.container.titles.securityContext')" name="securityContext">
        <Security v-model="container.securityContext" :mode="mode" />
      </Tab>
      <Tab :label="t('workload.container.titles.networking')" name="networking">
        <Networking v-model="podTemplateSpec" :mode="mode" />
      </Tab>
    </Tabbed>
    <div class="row mt-20">
      <div class="col span-12">
        <h3>
          Pods
        </h3>
        <ResourceTable
          :rows="pods"
          :headers="podHeaders"
          key-field="id"
          :search="false"
          :table-actions="false"
          :schema="podSchema"
          :show-groups="false"
        />
      </div>
    </div>
  </div>
</template>

<style>
.bordered-section {
  border-bottom: 1px solid var(--border);
  margin-bottom: 25px;
  padding-bottom: 25px;
}
</style>
