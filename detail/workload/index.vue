<script>
import createEditView from '@/mixins/create-edit-view';
import { STATE, NAME, NODE, POD_IMAGES } from '@/config/table-headers';
import { POD, WORKLOAD_TYPES, SECRET } from '@/config/types';
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
import Loading from '@/components/Loading';
import Storage from '@/edit/workload/storage';
import Job from '@/edit/workload/Job';
import VolumeClaimTemplate from '@/edit/workload/VolumeClaimTemplate';

import { mapGetters } from 'vuex';
import { allHash } from '@/utils/promise';

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
    Tab,
    VolumeClaimTemplate,
    Loading,
    Storage
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
    const hash = await allHash({
      pods:    this.value.pods(),
      secrets: this.$store.dispatch('cluster/findAll', { type: SECRET })
    });

    this.pods = hash.pods;
    this.secrets = hash.secrets;
  },

  data() {
    const isCronJob = this.value.type === WORKLOAD_TYPES.CRON_JOB;

    const podTemplateSpec = isCronJob ? this.value.spec.jobTemplate.spec.template.spec : this.value.spec?.template?.spec;

    const container = podTemplateSpec.containers[0];

    const name = this.value?.metadata?.name || this.value.id;

    const podSchema = this.$store.getters['cluster/schemaFor'](POD);

    return {
      type:           this.value.type,
      podSchema,
      name,
      pods:           null,
      secrets: [],
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

    podHeaders() {
      return this.pods ? [
        STATE,
        NAME,
        NODE,
        POD_IMAGES
      ] : null;
    },

    isJob() {
      return this.type === WORKLOAD_TYPES.JOB;
    },

    isCronJob() {
      return this.type === WORKLOAD_TYPES.CRON_JOB;
    },

    isStatefulSet() {
      return this.type === WORKLOAD_TYPES.STATEFUL_SET;
    },

    namespacedSecrets() {
      const namespace = this.value?.metadata?.namespace;

      if (namespace) {
        return this.secrets.filter(
          secret => secret.metadata.namespace === namespace
        );
      } else {
        return this.secrets;
      }
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
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
      <Tab :label="t('workload.storage.title')" name="storage" @active="$refs['storage'].refresh()">
        <Storage
          ref="storage"
          v-model="podTemplateSpec"
          :namespace="value.metadata.namespace"
          :secrets="namespacedSecrets"
          :mode="mode"
        />
      </Tab>
      <Tab v-if="isStatefulSet" :label="t('workload.container.titles.volumeClaimTemplates')" name="volumeClaimTemplates">
        <VolumeClaimTemplate v-model="value.spec" :mode="mode" />
      </Tab>
    </Tabbed>
    <div class="row mt-20">
      <div class="col span-12">
        <h3 class="pods-title">
          Pods
        </h3>
        <ResourceTable
          v-if="pods"
          :rows="pods"
          :headers="podHeaders"
          key-field="id"
          :table-actions="false"
          :schema="podSchema"
          :show-groups="false"
        />
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.pods-title{
position: relative;
top: 50px;
}
</style>
