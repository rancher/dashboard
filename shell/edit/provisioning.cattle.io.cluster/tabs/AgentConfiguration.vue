<script>
import { Banner } from '@components/Banner';
import GroupPanel from '@shell/components/GroupPanel';
import PodAffinity from '@shell/components/form/PodAffinity';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import Tolerations from '@shell/components/form/Tolerations';
import SchedulingCustomization from '@shell/components/form/SchedulingCustomization';
import { cleanUp } from '@shell/utils/object';
import { fetchSetting } from '@shell/utils/settings';
import { RadioGroup } from '@components/Form/Radio';
import { _EDIT } from '@shell/config/query-params';
// Affinity radio button choices
const DEFAULT = 'default';
const CUSTOM = 'custom';

// This is the form for Agent Configuration
// Used for both Cluster Agent and Fleet Agent configuration
export default {
  emits: ['input', 'scheduling-customization-changed'],

  components: {
    Banner,
    ContainerResourceLimit,
    GroupPanel,
    PodAffinity,
    NodeAffinity,
    RadioGroup,
    Tolerations,
    SchedulingCustomization
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
    },
    schedulingCustomizationFeatureEnabled: {
      type:     Boolean,
      required: false
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
    const nodeAffinity = this.value?.overrideAffinity?.nodeAffinity;
    const podAffinity = this.value?.overrideAffinity?.podAffinity;
    const podAntiAffinity = this.value?.overrideAffinity?.podAntiAffinity;

    let hasAffinityPopulated = false;

    if ((nodeAffinity && Object.keys(nodeAffinity).length) ||
      (podAffinity && Object.keys(podAffinity).length) ||
      (podAntiAffinity && Object.keys(podAntiAffinity).length)) {
      hasAffinityPopulated = true;
    }

    return {
      defaultAffinity: {},
      affinitySetting: hasAffinityPopulated ? CUSTOM : DEFAULT,
      nodeAffinity:    {}
    };
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
    isEdit() {
      return this.mode === _EDIT;
    },

    schedulingCustomizationVisible() {
      return this.schedulingCustomizationFeatureEnabled || (this.isEdit && this.value.schedulingCustomization );
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
  <div>
    <Banner
      :closable="false"
      color="info"
      label-key="cluster.agentConfig.banners.advanced"
    />

    <GroupPanel
      label-key="cluster.agentConfig.groups.podRequestsAndLimits"
      class="mt-20"
    >
      <Banner
        :closable="false"
        color="info"
        label-key="cluster.agentConfig.banners.limits"
      />
      <ContainerResourceLimit
        v-model:value="flatResources"
        :mode="mode"
        :show-tip="false"
        :handle-gpu-limit="false"
        class="mt-10"
      />
    </GroupPanel>

    <GroupPanel
      label-key="cluster.agentConfig.groups.podTolerations"
      class="mt-20"
    >
      <Banner
        :closable="false"
        color="info"
        label-key="cluster.agentConfig.banners.tolerations"
      />
      <Tolerations
        v-model:value="value.appendTolerations"
        :mode="mode"
        class="mt-10"
      />
    </GroupPanel>

    <GroupPanel
      label-key="cluster.agentConfig.groups.podAffinity"
      class="mt-20"
    >
      <RadioGroup
        v-model:value="affinitySetting"
        name="affinity-override"
        :mode="mode"
        :options="affinityOptions"
        class="mt-10"
        data-testid="affinity-options"
        @update:value="affinitySettingChange"
      />

      <Banner
        v-if="canEditAffinity"
        :closable="false"
        color="warning"
      >
        <p v-clean-html="t('cluster.agentConfig.banners.windowsCompatibility', {}, true)" />
      </Banner>

      <h4 v-if="canEditAffinity">
        {{ t('cluster.agentConfig.subGroups.podAffinityAnti') }}
      </h4>

      <PodAffinity
        v-if="canEditAffinity"
        :value="value"
        field="overrideAffinity"
        :mode="mode"
        class="mt-0 mb-20"
        :all-namespaces-option-available="true"
        :force-input-namespace-selection="true"
        :remove-labeled-input-namespace-label="true"
        data-testid="pod-affinity"
        @update:value="$emit('input', $event)"
      />

      <div
        v-if="canEditAffinity"
        class="separator"
      />
      <h4
        v-if="canEditAffinity"
        class="mt-20"
      >
        {{ t('cluster.agentConfig.subGroups.nodeAffinity') }}
      </h4>

      <NodeAffinity
        v-if="canEditAffinity"
        v-model:value="nodeAffinity"
        :matching-selector-display="true"
        :mode="mode"
        class="mt-0"
        data-testid="node-affinity"
        @update:value="updateNodeAffinity"
      />
    </GroupPanel>
    <GroupPanel
      v-if="schedulingCustomizationVisible"
      label-key="cluster.agentConfig.groups.schedulingCustomization"
      class="mt-20"
    >
      <SchedulingCustomization
        :value="value.schedulingCustomization"
        :mode="mode"
        :feature="schedulingCustomizationFeatureEnabled"
        :default-p-c="defaultPC"
        :default-p-d-b="defaultPDB"
        @scheduling-customization-changed="$emit('scheduling-customization-changed', $event)"
      />
    </GroupPanel>
  </div>
</template>

<style lang="scss" scoped>
.separator {
  width: 100%;
  border-top: 1px solid var(--border);
}
</style>
