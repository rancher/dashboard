<script>
import HealthCheck from '@shell/components/form/HealthCheck';
import Command from '@shell/components/form/Command';
import Security from '@shell/components/form/Security';
import WorkloadPorts from '@shell/components/form/WorkloadPorts';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import LabeledInput from '@shell/components/form/LabeledInput';
import { _CREATE, _VIEW } from '@shell/config/query-params';

export default {
  components: {
    HealthCheck,
    Command,
    Security,
    WorkloadPorts,
    ContainerResourceLimit,
    LabeledInput
  },

  props: {
    // container spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: _CREATE,
    }
  },

  data() {
    const {
      resources, readinessProbe, livenessProbe, startupProbe,
    } = this.value;

    const healthCheck = {
      readinessProbe, livenessProbe, startupProbe
    };

    return { resources, healthCheck };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    flatResources() {
      const { limits = {}, requests = {} } = this.resources || {};
      const { cpu:limitsCpu, memory:limitsMemory } = limits;
      const { cpu:requestsCpu, memory:requestsMemory } = requests;

      return {
        limitsCpu, limitsMemory, requestsCpu, requestsMemory
      };
    },

    hasResourceLimits() {
      const {
        limitsCpu, limitsMemory, requestsCpu, requestsMemory
      } = this.flatResources;

      return !!limitsCpu || !!limitsMemory || !!requestsCpu || !!requestsMemory;
    },

    hasHealthCheck() {
      const { readinessProbe, livenessProbe, startupProbe } = this.healthCheck;

      return !!readinessProbe || !!livenessProbe || !!startupProbe;
    }
  },
};
</script>

<template>
  <div v-if="isView">
    <div class="spacer"></div>
    <div>
      <div class="row">
        <div class="col span-4">
          <LabeledInput :label="t('workload.container.name')" :mode="mode" :value="value.name" />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model="value.image"
            :label="t('workload.container.image')"
            :placeholder="t('generic.placeholder', {text: 'nginx:latest'}, true)"
            required
            :mode="mode"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="value.imagePullPolicy"
            :label="t('workload.container.imagePullPolicy')"
            :mode="mode"
          />
        </div>
      </div>
    </div>
    <div class="spacer"></div>
    <div>
      <h3><t k="workload.container.titles.ports" /></h3>
      <WorkloadPorts v-if="value.ports" v-model="value.ports" :mode="mode" />
      <div v-else>
        <t k="workload.container.noPorts" />
      </div>
    </div>

    <div class="spacer"></div>
    <div>
      <h3><t k="workload.container.titles.command" /></h3>
      <Command v-model="value" :mode="mode" :secrets="[]" :config-maps="[]" />
    </div>

    <div class="spacer"></div>
    <div>
      <h3><t k="workload.container.titles.resources" /></h3>
      <ContainerResourceLimit v-if="hasResourceLimits" v-model="flatResources" :mode="mode" :show-tip="false" />
      <div v-else>
        <t k="workload.container.noResourceLimits" />
      </div>
    </div>

    <div class="spacer"></div>
    <div>
      <h3><t k="workload.container.titles.healthCheck" /></h3>
      <HealthCheck v-if="hasHealthCheck" v-model="healthCheck" :mode="mode" />
      <div v-else>
        <t k="workload.container.healthCheck.noHealthCheck" />
      </div>
    </div>

    <div>
      <h3><t k="workload.container.titles.securityContext" /></h3>
      <Security v-model="value.securityContext" :mode="mode" />
    </div>
  </div>
</template>
