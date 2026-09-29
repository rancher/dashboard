<script>
import { Banner } from '@components/Banner';
import { RcSection, SECTION_TYPE } from '@components/RcSection';
import { RcContentGroup } from '@components/Layout';
import PodAffinity from '@shell/components/form/PodAffinity';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import RcContainerResourceLimit from '@shell/components/RcContainerResourceLimit.vue';
import Tolerations from '@shell/components/form/Tolerations';
import RcSchedulingCustomization from '@shell/components/form/RcSchedulingCustomization.vue';
import { cleanUp } from '@shell/utils/object';
import { fetchSetting } from '@shell/utils/settings';
import { RadioGroup } from '@components/Form/Radio';
import { _EDIT } from '@shell/config/query-params';

// Affinity radio button choices
const DEFAULT = 'default';
const CUSTOM = 'custom';

/**
 * A copy of AgentConfiguration laid out for use inside RcSection: each of the
 * GroupPanels (requests and limits, tolerations, affinity, scheduling
 * customization) is an RcSection instead, and the pod/node affinity
 * sub-headings are nested RcSections.
 *
 * Used for both Cluster Agent and Fleet Agent configuration.
 */
export default {
  name: 'RcAgentConfiguration',

  emits: ['input', 'scheduling-customization-changed'],

  components: {
    Banner,
    RcContainerResourceLimit,
    RcSection,
    RcContentGroup,
    PodAffinity,
    NodeAffinity,
    RadioGroup,
    Tolerations,
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

  async fetch() {
    // Default affinity
    const settingId = `${ this.type }-agent-default-affinity`;
    const setting = await fetchSetting(this.$store, settingId);

    if (setting) {
      try {
        const parsed = JSON.parse(setting.value || setting.default);

        this.defaultAffinity = parsed || {};
      } catch (e) {
        console.error('Could not parse agent default setting', e); // eslint-disable-line no-console
        this.defaultAffinity = {};
      }
    }
  },

  data() {
    return {
      defaultAffinity: {},
      affinitySetting: DEFAULT,
      nodeAffinity:    {},
      SECTION_TYPE
    };
  },

  created() {
    const nodeAffinity = this.value?.overrideAffinity?.nodeAffinity;
    const podAffinity = this.value?.overrideAffinity?.podAffinity;
    const podAntiAffinity = this.value?.overrideAffinity?.podAntiAffinity;

    let hasAffinityPopulated = false;

    if ((nodeAffinity && Object.keys(nodeAffinity).length) ||
      (podAffinity && Object.keys(podAffinity).length) ||
      (podAntiAffinity && Object.keys(podAntiAffinity).length)) {
      hasAffinityPopulated = true;
    }

    this.affinitySetting = hasAffinityPopulated ? CUSTOM : DEFAULT;

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

    isEdit() {
      return this.mode === _EDIT;
    },

    schedulingCustomizationVisible() {
      return this.schedulingCustomizationFeatureEnabled || this.schedulingCustomizationOriginallyEnabled;
    },

    affinityOptions() {
      return [{
        label: this.t('cluster.agentConfig.affinity.default'),
        value: DEFAULT,
      }, {
        label: this.t('cluster.agentConfig.affinity.custom'),
        value: CUSTOM,
      }];
    },

    canEditAffinity() {
      return this.affinitySetting === CUSTOM;
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
      if (this.value) {
        this.value.overrideAffinity = this.value.overrideAffinity || {};
        this.value.appendTolerations = this.value.appendTolerations || [];
        this.value.overrideResourceRequirements = this.value.overrideResourceRequirements || {};

        this.nodeAffinity = this.value?.overrideAffinity?.nodeAffinity || {};
      }
    },

    affinitySettingChange() {
      if (this.affinitySetting === CUSTOM) {
        const parsedDefaultAffinites = JSON.parse(JSON.stringify(this.defaultAffinity));

        // Copy the default so that the user can edit it
        // this will cover the pod affinities
        this.value['overrideAffinity'] = parsedDefaultAffinites;

        // in order not to break the node affinity component, let's go for a slightly different way of handling the logic here
        if (parsedDefaultAffinites.nodeAffinity) {
          this.nodeAffinity = parsedDefaultAffinites.nodeAffinity;
        }
      } else {
        this.value['overrideAffinity'] = {};
      }
    },

    updateNodeAffinity(val) {
      this.value.overrideAffinity['nodeAffinity'] = val;
    }
  }
};
</script>

<template>
  <RcContentGroup>
    <Banner
      :closable="false"
      color="info"
      label-key="cluster.agentConfig.banners.advanced"
      class="m-0"
    />

    <RcSection
      :title="t('cluster.agentConfig.groups.podRequestsAndLimits')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
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
      :title="t('cluster.agentConfig.groups.podTolerations')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
      data-testid="agent-config-tolerations"
    >
      <Banner
        :closable="false"
        color="info"
        label-key="cluster.agentConfig.banners.tolerations"
        class="m-0"
      />
      <Tolerations
        v-model:value="value.appendTolerations"
        :mode="mode"
      />
    </RcSection>

    <RcSection
      :title="t('cluster.agentConfig.groups.podAffinity')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
      data-testid="agent-config-affinity"
    >
      <RadioGroup
        v-model:value="affinitySetting"
        name="affinity-override"
        :mode="mode"
        :options="affinityOptions"
        data-testid="affinity-options"
        @update:value="affinitySettingChange"
      />

      <template v-if="canEditAffinity">
        <Banner
          :closable="false"
          color="warning"
          class="m-0"
        >
          <p v-clean-html="t('cluster.agentConfig.banners.windowsCompatibility', {}, true)" />
        </Banner>

        <RcSection
          :title="t('cluster.agentConfig.subGroups.podAffinityAnti')"
          mode="with-header"
          :type="SECTION_TYPE.SECONDARY"
          expandable
        >
          <PodAffinity
            :value="value"
            field="overrideAffinity"
            :mode="mode"
            :all-namespaces-option-available="true"
            :force-input-namespace-selection="true"
            :remove-labeled-input-namespace-label="true"
            data-testid="pod-affinity"
            @update:value="$emit('input', $event)"
          />
        </RcSection>

        <RcSection
          :title="t('cluster.agentConfig.subGroups.nodeAffinity')"
          mode="with-header"
          :type="SECTION_TYPE.SECONDARY"
          expandable
        >
          <NodeAffinity
            v-model:value="nodeAffinity"
            :matching-selector-display="true"
            :mode="mode"
            data-testid="node-affinity"
            @update:value="updateNodeAffinity"
          />
        </RcSection>
      </template>
    </RcSection>

    <RcSection
      v-if="schedulingCustomizationVisible"
      :title="t('cluster.agentConfig.groups.schedulingCustomization')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
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

<style lang="scss" scoped>
// ArrayList spacing (footer mmt-6 24px, rows .box 10px + .info-box 20px) is
// replaced with a uniform 16px gap: between grouped rows and between the last
// row and the "Add" footer. With no rows, the footer needs no top margin.
:deep(.footer) {
  margin-top: 0;
}

:deep(.box + .footer) {
  margin-top: 16px;
}

:deep(.box:has(+ .footer)) {
  margin-bottom: 0;

  & > .info-box {
    margin-bottom: 0;
  }
}

:deep(.array-list-grouped > div > .box:not(:has(+ .footer))) {
  margin-bottom: 16px;

  & > .info-box {
    margin-bottom: 0;
  }
}

// PodAffinity and NodeAffinity add mt-20 above their grouped lists; the
// RcSection header already provides that spacing. mt-* helpers are
// !important, so the override has to be as well.
:deep(.array-list-grouped.mt-20) {
  margin-top: 0 !important;
}
</style>
