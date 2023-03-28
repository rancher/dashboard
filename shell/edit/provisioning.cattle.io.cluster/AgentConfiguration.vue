<script>
import { Banner } from '@components/Banner';
import GroupPanel from '@shell/components/GroupPanel';
import PodAffinity from '@shell/components/form/PodAffinity';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import Tolerations from '@shell/components/form/Tolerations';
import { cleanUp } from '@shell/utils/object';

export function cleanAgentConfiguration(model, key) {
  if (!model || !model[key]) {
    return;
  }

  const v = model[key];

  if (Array.isArray(v) && v.length === 0) {
    delete model[key];
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach((k) => {
      cleanAgentConfiguration(v, k);
    });

    if (Object.keys(v).length === 0) {
      delete model[key];
    }
  }
}

const GPU_KEY = 'nvidia.com/gpu';

// This is the form for Agent Configuration
// Used for both Cluster Agent and Fleet Agent configuration
export default {
  components: {
    Banner,
    ContainerResourceLimit,
    GroupPanel,
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
    },

    type: {
      type:     String,
      required: true,
    }

  },

  data() {
    const bannerMessageKey = `cluster.agentConfig.banners.${ this.type }Advanced`;

    return { bannerMessageKey };
  },

  created() {
    this.ensureValue();
  },

  computed: {
    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.value.overrideResourceRequirements || {};
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

        const existing = this.value?.overrideResourceRequirements || {};

        delete existing.requests;
        delete existing.limits;

        const out = {
          ...existing,
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

        this.$set(this.value, 'overrideResourceRequirements', cleanUp(out));
      },
    }
  },

  watch: {
    value() {
      this.ensureValue();
    }
  },

  methods: {
    ensureValue() {
      // Ensure we have the model structure needed for the form controls
      this.value.overrideAffinity = this.value.overrideAffinity || {};
      this.value.appendTolerations = this.value.appendTolerations || [];
      this.value.overrideResourceRequirements = this.value.overrideResourceRequirements || {};
    },
  }
};
</script>

<template>
  <div v-if="value && Object.keys(value).length">
    <Banner
      :closable="false"
      color="info"
      :label-key="bannerMessageKey"
    />
    <GroupPanel
      label-key="cluster.agentConfig.groups.podAffinity"
      class="mt-20"
    >
      <PodAffinity
        v-model="value"
        field="overrideAffinity"
        :mode="mode"
        class="mt-0"
      />
    </GroupPanel>

    <GroupPanel
      label-key="cluster.agentConfig.groups.podRequestsAndLimits"
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
      label-key="cluster.agentConfig.groups.podTolerations"
      class="mt-20"
    >
      <Tolerations
        v-model="value.appendTolerations"
        :mode="mode"
        class="mt-10"
      />
    </GroupPanel>
  </div>
</template>

<style lang="scss" scoped>
</style>
