<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { _CREATE, _VIEW } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

import { imageTypes } from '../util/gcp';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import Taints from '@shell/components/form/Taints.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

import AuthScopes from './AuthScopes.vue';

export default defineComponent({
  name: 'GKENodePool',

  components: {
    Checkbox,
    LabeledSelect,
    LabeledInput,
    UnitInput,
    Taints,
    ArrayList,
    KeyValue,
    AuthScopes
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    isNew: {
      type:    Boolean,
      default: false
    },

    clusterKubernetesVersion: {
      type:    String,
      default: ''
    },

    machineTypeOptions: {
      type:    Array as PropType<{label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}[]>,
      default: () => []
    },

    loadingMachineTypes: {
      type:    Boolean,
      default: false
    },

    version: {
      type:    String,
      default: ''
    },

    imageType: {
      type:    String,
      default: ''
    },

    machineType: {
      type:    String,
      default: ''
    },

    diskType: {
      type:    String,
      default: ''
    },

    diskSizeGb: {
      type:    Number,
      default: 0
    },

    localSsdCount: {
      type:    Number,
      default: 0
    },

    preemptible: {
      type:    Boolean,
      default: false
    },

    taints: {
      type:    Array,
      default: () => []
    },

    labels: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    tags: {
      type:    Array,
      default: () => []
    },

    name: {
      type:    String,
      default: ''
    },

    initialNodeCount: {
      type:    [String, Number],
      default: ''
    },

    maxPodsConstraint: {
      type:    [String, Number],
      default: ''
    },

    autoscaling: {
      type:    Boolean,
      default: false
    },

    autoRepair: {
      type:    Boolean,
      default: false
    },

    autoUpgrade: {
      type:    Boolean,
      default: false
    },

    minNodeCount: {
      type:    [String, Number],
      default: ''
    },

    maxNodeCount: {
      type:    [String, Number],
      default: ''
    },

    oauthScopes: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { upgradeKubernetesVersion: false, initialVersion: this.version };
  },

  watch: {
    upgradeKubernetesVersion(neu) {
      if (neu) {
        this.$emit('update:version', this.clusterKubernetesVersion);
      } else {
        this.$emit('update:version', this.initialVersion);
      }
    },

    clusterKubernetesVersion: {
      handler(neu) {
        if (neu && this.mode === _CREATE) {
          this.$emit('update:version', neu);
        }
      },
      immediate: true
    },

    autoscaling(neu) {
      if (!neu) {
        this.$emit('update:minNodeCount', null);
        this.$emit('update:maxNodeCount', null);
      } else {
        this.$emit('update:minNodeCount', '1');
        this.$emit('update:maxNodeCount', '3');
      }
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/withFallback' }),

    _VIEW() {
      return _VIEW;
    },

    // when initially created nodepools are configured to use the same k8s version as the control plane (clusterKubernetesVersion)
    // on edit, if the cp version is updated, the user is given the option to update each node pool as well
    upgradeAvailable() {
      if (this.mode === _CREATE) {
        return false;
      }

      return this.initialVersion !== this.clusterKubernetesVersion;
    },

    imageTypeOptions() {
      return imageTypes.map((type) => {
        return {
          value: type,
          label: this.t(`gke.imageType.${ type }`, null, type)
        };
      });
    },

    diskTypeOptions() {
      return [
        {
          label: this.t('gke.diskType.standard'),
          value: 'pd-standard',
        },
        {
          label: this.t('gke.diskType.ssd'),
          value: 'pd-ssd',
        }
      ];
    },

    selectedImageType: {
      get() {
        return this.imageTypeOptions.find((opt) => opt.value === this.imageType) || { value: this.imageType, label: this.t(`gke.imageType.${ this.imageType }`, null, this.imageType) };
      },
      set(neu: {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}) {
        this.$emit('update:imageType', neu.value);
      }
    },

    selectedMachineType: {
      get(): {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}| undefined {
        return this.machineTypeOptions.find((opt) => opt?.value === this.machineType);
      },
      set(neu: {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}) {
        this.$emit('update:machineType', neu.value);
      }
    },

    selectedDiskType: {
      get() {
        return this.diskTypeOptions.find((opt) => opt.value === this.diskType);
      },
      set(neu: {label:string, value: string}) {
        this.$emit('update:diskType', neu.value);
      }
    },
  },
});

</script>

<template>
  <div>
    <h3 class="mt-20">
      {{ t('gke.nodeDetails') }}
    </h3>
    <hr>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-if="upgradeAvailable"
          v-model="upgradeKubernetesVersion"
          :mode="mode"
          :label="t('gke.version.upgrade', {clusterKubernetesVersion, version: initialVersion})"
        />
        <div
          v-else
        >
          <LabeledInput
            label-key="gke.version.label"
            :value="version"
            disabled
          />
        </div>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :value="selectedImageType"
          :mode="mode"
          :options="imageTypeOptions"
          label-key="gke.imageType.label"
          @selecting="selectedImageType=$event"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          :mode="mode"
          :options="machineTypeOptions"
          :loading="loadingMachineTypes"
          :value="selectedMachineType"
          label-key="gke.machineType.label"
          :disabled="!isNew"
          @selecting="selectedMachineType = $event"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledSelect
          :mode="mode"
          :options="diskTypeOptions"
          :value="selectedDiskType"
          label-key="gke.diskType.label"
          :disabled="!isNew"
          @selecting="selectedDiskType=$event"
        />
      </div>
      <div class="col span-4">
        <UnitInput
          :mode="mode"
          :value="diskSizeGb"
          label-key="gke.diskSizeGb.label"
          suffix="GB"
          :disabled="!isNew"
          :rules="rules.diskSizeGb"
          @input="$emit('update:diskSizeGb', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :mode="mode"
          :value="localSsdCount"
          label-key="gke.localSsdCount.label"
          :disabled="!isNew"
          :rules="rules.ssdCount"
          @input="$emit('update:localSsdCount', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          label-key="gke.preemptible.label"
          :mode="mode"
          :value="preemptible"
          :disabled="!isNew"
          @input="$emit('update:preemptible', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <Taints
          :mode="mode"
          :value="taints"
          :disabled="!isNew"
          @input="$emit('update:taints', $event)"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <KeyValue
          :mode="mode"
          :value="labels"
          :title="t('gke.nodeLabels.label')"
          :read-allowed="false"
          :as-map="true"
          :title-protip="t('gke.nodeLabels.tooltip')"
          :add-label="t('gke.nodeLabels.add')"
          :disabled="!isNew"
          @input="$emit('update:labels', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <ArrayList
          :mode="isNew ? mode : _VIEW"
          :value="tags"
          :title="t('gke.tags.label')"
          :add-label="t('gke.tags.add')"
          @input="$emit('update:tags', $event)"
        />
      </div>
    </div>

    <h3>{{ t('gke.groupDetails') }}</h3>
    <hr>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          :mode="mode"
          :value="name"
          label-key="gke.groupName.label"
          :disabled="!isNew"
          :rules="rules.poolName"
          required
          @input="$emit('update:name', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          type="number"
          :mode="mode"
          :value="initialNodeCount"
          label-key="gke.initialNodeCount.label"
          :rules="rules.initialNodeCount"
          @input="$emit('update:initialNodeCount', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          type="number"
          :mode="mode"
          :value="maxPodsConstraint"
          label-key="gke.maxPodsConstraint.label"
          @input="$emit('update:maxPodsConstraint', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4 checkbox-column">
        <Checkbox
          :mode="mode"
          :value="autoscaling"
          label-key="gke.autoscaling.label"
          @input="$emit('update:autoscaling', $event)"
        />
        <Checkbox
          :mode="mode"
          :value="autoRepair"
          label-key="gke.autoRepair.label"
          @input="$emit('update:autoRepair', $event)"
        />
        <Checkbox
          :mode="mode"
          :value="autoUpgrade"
          label-key="gke.autoUpgrade.label"
          @input="$emit('update:autoUpgrade', $event)"
        />
      </div>
      <template v-if="autoscaling">
        <div class="col span-4">
          <LabeledInput
            :mode="mode"
            type="number"
            :value="minNodeCount"
            label-key="gke.minNodeCount.label"
            @input="$emit('update:minNodeCount', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :mode="mode"
            type="number"
            :value="maxNodeCount"
            label-key="gke.maxNodeCount.label"
            @input="$emit('update:maxNodeCount', $event)"
          />
        </div>
      </template>
    </div>

    <AuthScopes
      :mode="mode"
      :value="oauthScopes"
      :disabled="!isNew"
      @input="$emit('update:oauthScopes', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.checkbox-column{
  display: flex;
  flex-direction: column;
  &>*{
    margin-bottom: 5px;
  }
}
</style>
