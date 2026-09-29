<script>
import { Banner } from '@components/Banner';
import { RcSection, SECTION_TYPE } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import RcContainerResourceLimit from '@shell/components/RcContainerResourceLimit.vue';
import RcSchedulingCustomization from '@shell/components/form/RcSchedulingCustomization.vue';
import { cleanUp } from '@shell/utils/object';

/**
 * Agent configuration laid out for use inside RcSection: requests and limits
 * and scheduling customization, each as a collapsed RcSection.
 *
 * Unlike AgentConfiguration (v2prov) this doesn't offer tolerations or
 * affinity.
 *
 * Used for both Cluster Agent and Fleet Agent configuration.
 */
export default {
  name: 'RcAgentConfiguration',

  emits: ['scheduling-customization-changed'],

  components: {
    Banner,
    RcContainerResourceLimit,
    RcSection,
    RcContentGroup,
    RcSchedulingCustomization
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
      type:     String, // AGENT_CONFIGURATION_TYPES
      required: true,
    },

    schedulingCustomizationFeatureEnabled: {
      type:     Boolean,
      required: false
    },

    schedulingCustomizationOriginallyEnabled: {
      type:    Boolean,
      default: false
    },

    defaultPC: {
      type:    Object,
      default: () => {},
    },

    defaultPDB: {
      type:    Object,
      default: () => {},
    }
  },

  data() {
    return { SECTION_TYPE };
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
        } = limits;
        const { cpu: requestsCpu, memory: requestsMemory } = requests;

        return {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
        };
      },
      set(neu) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
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
            cpu:    limitsCpu,
            memory: limitsMemory,
          },
        };

        this.value['overrideResourceRequirements'] = cleanUp(out);
      },
    },

    schedulingCustomizationVisible() {
      return this.schedulingCustomizationFeatureEnabled || this.schedulingCustomizationOriginallyEnabled;
    },
  },

  watch: {
    value() {
      this.ensureValue();
    }
  },

  methods: {
    ensureValue() {
      // Ensure we have the model structure needed for the form controls
      if (this.value) {
        this.value.overrideResourceRequirements = this.value.overrideResourceRequirements || {};
      }
    },
  }
};
</script>

<template>
  <RcContentGroup>
    <RcSection
      :title="t('cluster.agentConfig.groups.podRequestsAndLimits')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
      :expanded="false"
      data-testid="agent-config-requests-limits"
    >
      <Banner
        :closable="false"
        color="info"
        label-key="cluster.agentConfig.banners.limits"
        class="m-0"
      />
      <RcContainerResourceLimit
        v-model:value="flatResources"
        :mode="mode"
        :show-tip="false"
        :handle-gpu-limit="false"
      />
    </RcSection>

    <RcSection
      v-if="schedulingCustomizationVisible"
      :title="t('cluster.agentConfig.groups.schedulingCustomization')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
      :expanded="false"
      data-testid="agent-config-scheduling-customization"
    >
      <RcSchedulingCustomization
        :value="value.schedulingCustomization"
        :mode="mode"
        :type="type"
        :feature="schedulingCustomizationFeatureEnabled"
        :default-p-c="defaultPC"
        :default-p-d-b="defaultPDB"
        @scheduling-customization-changed="$emit('scheduling-customization-changed', $event)"
      />
    </RcSection>
  </RcContentGroup>
</template>
