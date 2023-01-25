<script>
import GroupPanel from '@shell/components/GroupPanel';
import KeyValue from '@shell/components/form/KeyValue';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import PodAffinity from '@shell/components/form/PodAffinity';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import HealthCheck from '@shell/components/form/HealthCheck';
import Tolerations from '@shell/components/form/Tolerations';

import { cleanUp } from '@shell/utils/object';

const GPU_KEY = 'nvidia.com/gpu';

export default {
  components: {
    ContainerResourceLimit,
    GroupPanel,
    HealthCheck,
    KeyValue,
    MatchExpressions,
    PodAffinity,
    Tolerations,
  },
  props: {
    value: {
      type:    Object,
      default: () => {},
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  data() {
    const out = {};

    return out;
  },

  created() {
    this.ensureValue();
  },

  computed: {
    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.value.pod?.resources || {};
        const {
          cpu: limitsCpu,
          memory: limitsMemory,
          [GPU_KEY]: limitsGpu,
        } = limits;
        const { cpu: requestsCpu, memory: requestsMemory } = requests;

        return {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu,
        };
      },
      set(neu) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu,
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory,
          },
          limits: {
            cpu:       limitsCpu,
            memory:    limitsMemory,
            [GPU_KEY]: limitsGpu,
          },
        };

        this.$set(this.value.pod, 'resources', cleanUp(out));
      },
    }
  },

  watch: {
    value() {
      this.ensureValue();
    }
  },

  methods: {
    debug() {
      console.log(JSON.parse(JSON.stringify(this.value))); // eslint-disable-line no-console
    },

    ensureValue() {
      this.value.labels = this.value.labels || { 'default-label': 'default-value' };

      if (!this.value.selector) {
        this.value.selector = {};
      }

      this.value.affinity = this.value.affinity || {};

      this.value.pod = this.value.pod || {};
      this.value.pod.labels = this.value.pod.labels || [];
      this.value.pod.containers = this.value.pod.containers || {};
      this.value.pod.tolerations = this.value.pod.tolerations || [];
    }
  }
};
</script>

<template>
  <div v-if="value && Object.keys(value).length">
    <button
      class="btn btn-small role-primary"
      @click="debug"
    >
      Show Object
    </button>
    <GroupPanel
      label-key="cluster.clusterAgentConfig.groups.deploymentLabels"
    >
      <KeyValue
        v-model="value.labels"
        :protected-keys="[]"
        :add-label="t('labels.addLabel')"
        :mode="mode"
        :read-allowed="false"
        :value-can-be-empty="true"
      />
    </GroupPanel>

    <GroupPanel
      label="Selector"
      class="mt-20"
    >
      <!-- <h4>Match Labels</h4>

      <KeyValue
        key="labels"
        :value="value.selector.matchLabels"
        :protected-keys="[]"
        :add-label="t('labels.addLabel')"
        :mode="mode"
        :read-allowed="false"
        :value-can-be-empty="true"
      />

      <h4 class="mt-10">Match Expressions</h4> -->

      <MatchExpressions
        v-model="value.selector"
        :mode="mode"
        class="col span-12 mt-20"
        type="pod"
        :show-remove="false"
      />
    </GroupPanel>

    <GroupPanel
      label="Pod Affinity"
      class="mt-20"
    >
      <PodAffinity
        v-model="value"
        :mode="mode"
        class="mt-0"
      />
    </GroupPanel>

    <GroupPanel
      label="Pod Labels"
      class="mt-20"
    >
      <KeyValue
        v-model="value.pod.labels"
        :protected-keys="[]"
        :add-label="t('labels.addLabel')"
        :mode="mode"
        :read-allowed="false"
        :value-can-be-empty="true"
      />
    </GroupPanel>

    <GroupPanel
      label="Pod Requests and Limits"
      class="mt-20"
    >
      <ContainerResourceLimit
        v-model="flatResources"
        :mode="mode"
        :show-tip="false"
        class="mt-10"
      />
    </GroupPanel>

    <GroupPanel
      label="Pod Health Checks"
      class="mt-20"
    >
      <HealthCheck
        :value="value.pod.containers"
        :mode="mode"
      />
    </GroupPanel>

    <GroupPanel
      label="Pod Tolerations"
      class="mt-20"
    >
      <Tolerations
        v-model="value.pod.tolerations"
        :mode="mode"
      />
    </GroupPanel>
  </div>
</template>

<style lang="scss" scoped>
</style>
