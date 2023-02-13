<script>
import jsyaml from 'js-yaml';
import Vue from 'Vue';
import GroupPanel from '@shell/components/GroupPanel';
import KeyValue from '@shell/components/form/KeyValue';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import PodAffinity from '@shell/components/form/PodAffinity';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import HealthCheck from '@shell/components/form/HealthCheck';
import Tolerations from '@shell/components/form/Tolerations';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

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
    YamlEditor,
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
    const out = {
      editorMode: EDITOR_MODES.VIEW_CODE,
      yaml:       '',
      showYaml:   false,
    };

    return out;
  },

  created() {
    this.ensureValue();
  },

  computed: {
    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.value.pod?.containers || {};
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

        const existing = this.value?.pod?.containers || {};

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

        this.$set(this.value.pod, 'containers', cleanUp(out));
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
      this.value.pod.containers.health = this.value.pod.containers.health || {};
      this.value.pod.tolerations = this.value.pod.tolerations || [];
    },

    updateYaml() {
      const yaml = jsyaml.dump(this.value);
      const component = this.$refs.yamleditor;

      Vue.set(this, 'yaml', yaml);

      if (component) {
        component.updateValue(yaml);
      }

      this.showYaml = !this.showYaml;
    }
  }
};
</script>

<template>
  <div v-if="value && Object.keys(value).length">
    <button
      class="btn btn-small role-primary mb-10"
      @click="updateYaml"
    >
      Toggle Object View
    </button>

    <YamlEditor
      v-if="showYaml"
      ref="yamleditor"
      :value="yaml"
    />
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
        v-model="value.pod.containers.health"
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
