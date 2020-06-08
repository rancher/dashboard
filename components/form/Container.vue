<script>
import { cleanUp } from '@/utils/object';
import HealthCheck from '@/components/form/HealthCheck';
import Command from '@/components/form/Command';
import Security from '@/components/form/Security';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import WorkloadPorts from '@/components/form/WorkloadPorts';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    HealthCheck,
    Command,
    Security,
    Tabbed,
    Tab,
    WorkloadPorts,
    LabeledInput,
    LabeledSelect,
    ContainerResourceLimit
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
      default: 'create'
    },

    configMaps: {
      type:    Array,
      default: () => []
    },

    secrets: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    const {
      name, image, imagePullPolicy = 'IfNotPresent', ports, resources, readinessProbe, livenessProbe, startupProbe, securityContext, env = [], envFrom = [], command, args, workingDir, stdin = false, stdinOnce = false, tty = false
    } = this.value;

    const healthCheck = {
      readinessProbe, livenessProbe, startupProbe
    };

    const commandTab = {
      env, envFrom, command, args, workingDir, stdin, stdinOnce, tty
    };

    return {
      name, image, imagePullPolicy, ports, resources, healthCheck, securityContext, commandTab
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.resources || {};
        const { cpu:limitsCpu, memory:limitsMemory } = limits;
        const { cpu:requestsCpu, memory:requestsMemory } = requests;

        return {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory
        };
      },
      set(neu) {
        const {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory
          },
          limits: {
            cpu:    limitsCpu,
            memory: limitsMemory
          }
        };

        this.resources = cleanUp(out);
      }
    },
  },

  methods: {
    update() {
      const {
        name, image, imagePullPolicy, ports, resources, healthCheck, securityContext, commandTab
      } = this;

      const out = {
        name, image, imagePullPolicy, ports, resources, ...healthCheck, securityContext, ...commandTab
      };

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <div v-if="isView">
    <div>
      <h3><t k="workload.container.titles.ports" /></h3>
      <WorkloadPorts v-model="ports" :mode="mode" />
      <hr class="mt-20 mb-20" />
    </div>
    <div>
      <h3><t k="workload.container.titles.command" /></h3>
      <Command v-model="commandTab" :mode="mode" :secrets="secrets" :config-maps="configMaps" />
      <hr class="mt-20 mb-20" />
    </div>

    <div>
      <h3><t k="workload.container.titles.resources" /></h3>
      <ContainerResourceLimit v-model="flatResources" :mode="mode" :show-tip="false" />
      <hr class="mt-20 mb-20" />
    </div>

    <div>
      <h3><t k="workload.container.titles.healthCheck" /></h3>
      <HealthCheck v-model="healthCheck" :mode="mode" />
      <hr class="mt-20 mb-20" />
    </div>

    <div>
      <h3><t k="workload.container.titles.securityContext" /></h3>
      <Security v-model="securityContext" :mode="mode" />
    </div>
  </div>
  <div v-else @input="update">
    <div class="row">
      <div class="col span-4">
        <LabeledInput v-model="name" :label="t('workload.container.name')" :mode="mode" required />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="image" :label="t('workload.container.image')" :mode="mode" required />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="imagePullPolicy"
          :label="t('workload.container.imagePullPolicy')"
          :options="['Always', 'IfNotPresent', 'Never']"
          :mode="mode"
          @input="update"
        />
      </div>
    </div>
    <Tabbed class="contrast">
      <Tab name="ports" label="Ports">
        <WorkloadPorts v-model="ports" :mode="mode" />
      </Tab>
      <Tab label="Command" name="command">
        <Command v-model="commandTab" :mode="mode" :secrets="secrets" :config-maps="configMaps" />
      </Tab>
      <Tab label="Resources" name="resources">
        <ContainerResourceLimit v-model="flatResources" :mode="mode" :show-tip="false" />
      </Tab>
      <Tab label="Health Check" name="healthCheck">
        <HealthCheck v-model="healthCheck" :mode="mode" />
      </Tab>
      <Tab label="Security Context" name="securityContext">
        <Security v-model="securityContext" :mode="mode" />
      </Tab>
    </Tabbed>
  </div>
</template>
