<script>

import { defineComponent } from 'vue';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Nodes from '@pkg/imported/components/Nodes.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { getAllOptionsAfterCurrentVersion, filterOutDeprecatedPatchVersions } from '@shell/utils/cluster';

export default defineComponent({
  name:       'Basics',
  components: {
    LabeledSelect, Nodes, Checkbox
  },
  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    versions: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    defaultVersion: {
      type:    String,
      default: () => {
        return '';
      }
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    config: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    loadingVersions: {
      type:    Boolean,
      default: false
    },
    rules: {
      default: () => ({
        workerConcurrency:       [],
        controlPlaneConcurrency: []
      }),
      type: Object,
    },

  },
  emits: ['kubernetes-version-changed', 'drain-server-nodes-changed', 'server-concurrency-changed',
    'drain-worker-nodes-changed', 'worker-concurrency-changed', 'enable-authorized-endpoint', 'input'],
  data() {
    const store = this.$store;
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;
    const originalVersion = this.config.kubernetesVersion;

    return {
      supportedVersionRange, originalVersion, showDeprecatedPatchVersions: false
    };
  },
  computed: {
    versionOptions() {
      const cur = this.originalVersion;
      let out = getAllOptionsAfterCurrentVersion(this.$store, this.versions, cur, this.defaultVersion);

      if (!this.showDeprecatedPatchVersions) {
        // Normally, we only want to show the most recent patch version
        // for each Kubernetes minor version. However, if the user
        // opts in to showing deprecated versions, we don't filter them.
        out = filterOutDeprecatedPatchVersions(out, cur);
      }
      const existing = out.find((x) => x.value === cur);

      if (existing) {
        existing.disabled = false;
      }

      return out;
    },
    kubernetesVersion() {
      return this.config?.kubernetesVersion || '';
    },

    upgradeStrategy() {
      if ( this.value?.rke2Config ) {
        return this.value.rke2Config?.rke2upgradeStrategy;
      }

      return this.value?.k3sConfig?.k3supgradeStrategy;
    },
    // If the cluster hasn't been fully imported yet, we won't have this information yet
    // and everything in this tab should be disabled
    configMissing() {
      return !!this.config;
    }

  },
});

</script>
<template>
  <div>
    <div class="row span-12">
      <div class="col span-4">
        <LabeledSelect
          v-model:value="config.kubernetesVersion"
          data-testid="cruimported-kubernetesversion"
          :mode="mode"
          :options="versionOptions"
          label-key="cluster.kubernetesVersion.label"
          option-key="value"
          option-label="label"
          :disabled="configMissing"
          :loading="loadingVersions"
          @update:value="$emit('kubernetes-version-changed', $event)"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          v-model:value="showDeprecatedPatchVersions"
          :label="t('cluster.kubernetesVersion.deprecatedPatches')"
          :tooltip="t('cluster.kubernetesVersion.deprecatedPatchWarning')"
          class="patch-version"
          :disabled="configMissing"
        />
      </div>
    </div>
    <div class="row span-12">
      <div class="col span-4 spacer">
        <Nodes
          :value="upgradeStrategy"
          :disabled="configMissing"
          :mode="mode"
          :is-worker="false"
          :rules="{'concurrency': rules.controlPlaneConcurrency}"
          @drain-server-nodes-changed="$emit('drain-server-nodes-changed', $event)"
          @server-concurrency-changed="$emit('server-concurrency-changed', $event)"
        />
      </div>
      <div class="col span-4 spacer">
        <Nodes
          :value="upgradeStrategy"
          :disabled="configMissing"
          :mode="mode"
          :is-worker="true"
          :rules="{'concurrency': rules.workerConcurrency}"
          @drain-worker-nodes-changed="$emit('drain-worker-nodes-changed', $event)"
          @worker-concurrency-changed="$emit('worker-concurrency-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
