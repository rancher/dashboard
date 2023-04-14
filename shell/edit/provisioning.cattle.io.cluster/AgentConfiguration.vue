<script>
import { Banner } from '@components/Banner';
import GroupPanel from '@shell/components/GroupPanel';
import PodAffinity from '@shell/components/form/PodAffinity';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import Tolerations from '@shell/components/form/Tolerations';
import { cleanUp } from '@shell/utils/object';
import { fetchSetting } from '@shell/utils/settings';
import { RadioGroup } from '@components/Form/Radio';

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

// Affinity radio button choices
const DEFAULT = 'default';
const CUSTOM = 'custom';

// This is the form for Agent Configuration
// Used for both Cluster Agent and Fleet Agent configuration
export default {
  components: {
    Banner,
    ContainerResourceLimit,
    GroupPanel,
    PodAffinity,
    NodeAffinity,
    RadioGroup,
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

  async fetch() {
    // Default affinity
    const settingId = `${ this.type }-agent-default-setting`;
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
    const bannerMessageKey = `cluster.agentConfig.banners.${ this.type }Advanced`;

    // TODO: Set affinitySetting to CUSTOM if editing and affinity is not empty

    return {
      bannerMessageKey,
      defaultAffinity: {},
      affinitySetting: DEFAULT,
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
        this.$set(this.value, 'overrideAffinity', parsedDefaultAffinites);

        // in order not to break the node affinity component, let's go for a slightly different way of handling the logic here
        if (parsedDefaultAffinites.nodeAffinity) {
          this.nodeAffinity = parsedDefaultAffinites.nodeAffinity;
        }
      } else {
        this.$set(this.value, 'overrideAffinity', {});
      }
    },
    updateNodeAffinity(val) {
      this.$set(this.value.overrideAffinity, 'nodeAffinity', val);
    }
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
      label-key="cluster.agentConfig.groups.podRequestsAndLimits"
      class="mt-20"
    >
      <Banner
        :closable="false"
        color="info"
        label-key="cluster.agentConfig.banners.limits"
      />
      <ContainerResourceLimit
        v-model="flatResources"
        :mode="mode"
        :show-tip="false"
        :handle-gpu-limit="false"
        class="mt-10"
      />
    </GroupPanel>

    <GroupPanel
      label-key="cluster.agentConfig.groups.podAffinity"
      class="mt-20"
    >
      <RadioGroup
        v-model="affinitySetting"
        name="affinity-override"
        :mode="mode"
        :options="affinityOptions"
        class="mt-10"
        data-testid="affinity-options"
        @input="affinitySettingChange"
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
        v-model="value"
        field="overrideAffinity"
        :mode="mode"
        class="mt-0 mb-20"
        :all-namespaces-option-available="true"
        :force-input-namespace-selection="true"
        data-testid="pod-affinity"
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
        v-model="nodeAffinity"
        :matching-selector-display="true"
        :mode="mode"
        class="mt-0"
        data-testid="node-affinity"
        @input="updateNodeAffinity"
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
        v-model="value.appendTolerations"
        :mode="mode"
        class="mt-10"
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
